const twilio = require('twilio');
const { createTicket, getUserTickets, getTicketById } = require('./controllers/ticketController.js');
const { uploadImage } = require('./controllers/imageController.js');
const { supabase } = require('./config/supabaseClient');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient;

// Store for user conversation states
const userStates = new Map();

// Auto-register WhatsApp user
async function autoRegisterWhatsAppUser(phoneNumber) {
  try {
    // Clean phone number
    const cleanNumber = phoneNumber.replace('whatsapp:', '');

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('whatsapp_number', cleanNumber)
      .single();

    if (!existingUser) {
      // Create new user
      await supabase
        .from('users')
        .insert([
          {
            name: `WhatsApp User ${cleanNumber.slice(-4)}`,
            whatsapp_number: cleanNumber,
            phone_number: cleanNumber,
            notification_preferences: {
              telegram: false,
              whatsapp: true,
              push: false
            },
            is_active: true,
          },
        ]);

      console.log(`✅ Auto-registered WhatsApp user: ${cleanNumber}`);
    }
  } catch (error) {
    console.error('Error auto-registering WhatsApp user:', error);
  }
}

function initTwilioClient() {
  if (!accountSid || !authToken || !twilioNumber) {
    console.error('❌ Twilio credentials not configured in .env file');
    console.log('⚠️ Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER');
    return null;
  }

  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio WhatsApp client initialized successfully');
    console.log(`📱 WhatsApp Number: ${twilioNumber}`);
    return twilioClient;
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
    return null;
  }
}

async function sendWhatsAppMessage(to, message) {
  if (!twilioClient) {
    // Don't throw here to avoid crashing upstream flows. Return queued=false and an error object.
    console.error('Twilio client not initialized');
    return { success: false, queued: false, error: 'Twilio client not initialized' };
  }

  // Ensure 'to' number has whatsapp: prefix (declare outside try block so it's available in catch)
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  try {
    const response = await twilioClient.messages.create({
      from: twilioNumber,
      to: toNumber,
      body: message
    });
    
    console.log(`✅ Message sent to ${toNumber}: ${response.sid}`);
    return { success: true, queued: false, sid: response.sid };
  } catch (error) {
    // Twilio rate limit / sandbox limit: code 63038 or HTTP 429
    const status = error && (error.status || (error.response && error.response.status));
    const code = error && (error.code || (error.response && error.response.body && error.response.body.code));

    console.error(`❌ Failed to send message to ${to}:`, error.message || error);

    // If this is the known daily limit error, queue the outgoing message for later retry
    if (status === 429 || code === 63038) {
      try {
        await queueOutgoingMessage({ to: toNumber, body: message, errorCode: code || status, errorMessage: error.message });
        console.warn(`⚠️ Queued outbound WhatsApp message for ${toNumber} due to Twilio limit (code=${code || status})`);
        // Do not throw — return queued indicator so callers continue gracefully
        return { success: false, queued: true, reason: 'twilio_limit', code: code || status };
      } catch (qerr) {
        console.error('❌ Failed to queue outbound message:', qerr);
        return { success: false, queued: false, error: qerr };
      }
    }

    // For other errors, return failure but don't throw to avoid crashing flows that call this function
    return { success: false, queued: false, error: error.message || error };
  }
}

/**
 * Append outgoing message to a simple local queue (JSON Lines) for later retry.
 * This is intentionally simple and does not require DB schema changes.
 */
async function queueOutgoingMessage(entry) {
  const queueDir = path.join(__dirname, '..', 'outbound_queue');
  const queueFile = path.join(queueDir, 'queue.jsonl');

  if (!fs.existsSync(queueDir)) {
    fs.mkdirSync(queueDir, { recursive: true });
  }

  const payload = Object.assign({ ts: new Date().toISOString() }, entry);
  const line = JSON.stringify(payload) + '\n';

  return new Promise((resolve, reject) => {
    fs.appendFile(queueFile, line, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

async function handleIncomingMessage(req, res) {
  try {
    const { From, Body, MessageSid, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    
    // Extract phone number (remove whatsapp: prefix)
    const phoneNumber = From.replace('whatsapp:', '');
    const messageText = Body || '';
    const hasMedia = parseInt(NumMedia) > 0;

    console.log(`📨 WhatsApp message from ${phoneNumber}: ${messageText}${hasMedia ? ' (with media)' : ''}`);

    // Auto-register user
    await autoRegisterWhatsAppUser(From);

    // Handle media (images or videos)
    if (hasMedia && MediaContentType0) {
      if (MediaContentType0.startsWith('image/') || MediaContentType0.startsWith('video/')) {
        await handleMediaMessage(From, phoneNumber, MediaUrl0, MediaContentType0);
      }
    }
    // Handle commands or conversation
    else if (messageText.startsWith('/')) {
      await handleCommand(From, phoneNumber, messageText);
    } else {
      await handleConversation(From, phoneNumber, messageText);
    }

    // Respond with TwiML (required by Twilio)
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (error) {
    console.error('❌ Error handling incoming message:', error);
    res.status(500).send('<Response></Response>');
  }
}

async function handleMediaMessage(from, userId, mediaUrl, mediaType) {
  const userState = userStates.get(userId);

  const mediaTypeLabel = mediaType.startsWith('video/') ? 'video' : 'photo';
  console.log(`📸🎥 WhatsApp ${mediaTypeLabel} received from ${userId}, state:`, userState?.state);

  if (!userState || userState.state !== 'collecting_images') {
    return await sendWhatsAppMessage(from, 
      '📸🎥 Please use /ticket first to start a complaint, then add media when prompted.'
    );
  }

  try {
    console.log(`📥 Downloading WhatsApp ${mediaTypeLabel} from: ${mediaUrl}`);
    
    // Download media from Twilio
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await axios.get(mediaUrl, {
      headers: { 'Authorization': authHeader },
      responseType: 'arraybuffer'
    });
    
    const buffer = Buffer.from(response.data);
    
    console.log(`✅ WhatsApp ${mediaTypeLabel} downloaded, size: ${buffer.length} bytes`);
    
    // Determine file extension
    const extension = mediaType.startsWith('video/') ? 'mp4' : 'jpg';
    
    // Store media info temporarily
    userState.images.push({
      buffer: buffer,
      filename: `${Date.now()}.${extension}`,
      mimetype: mediaType
    });

    // Update state
    userStates.set(userId, userState);

    await sendWhatsAppMessage(from,
      `✅ ${mediaTypeLabel.charAt(0).toUpperCase() + mediaTypeLabel.slice(1)} ${userState.images.length} received!\n\n` +
      `📸🎥 Send more photos/videos or reply "done" to finish and create ticket.\n` +
      `Maximum 3 media files allowed (${userState.images.length}/3).`
    );

    // Auto-create ticket if 3 media files reached
    if (userState.images.length >= 3) {
      console.log(`📸 Max media files reached, auto-creating ticket`);
      await createTicketWithImagesWhatsApp(from, userId, userState);
    }

  } catch (error) {
    console.error('Error handling WhatsApp media:', error);
    await sendWhatsAppMessage(from, '❌ Error uploading media. Please try again or send "done" to create ticket.');
  }
}

async function handleCommand(from, userId, messageText) {
  const parts = messageText.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  try {
    switch (command) {
      case '/start':
        await sendWhatsAppMessage(from, 
          `🏛️ *Welcome to Municipal Services Bot!*\n\n` +
          `I'm here to help you report and track municipal complaints.\n\n` +
          `📋 *Available Commands:*\n` +
          `/help - Show all commands\n` +
          `/ticket - Report a new complaint\n` +
          `/mytickets - View your complaints\n` +
          `/status <ticket-id> - Check complaint status\n\n` +
          `💡 *Departments we handle:*\n` +
          `🛣️ Roadway (potholes, roads)\n` +
          `🧹 Cleaning (garbage, sanitation)\n` +
          `🚰 Drainage (blocked drains)\n` +
          `💧 Water Supply (water issues)\n\n` +
          `Let's make our city better together! 🌟`
        );
        break;

      case '/help':
        await sendWhatsAppMessage(from,
          `📚 *Help & Commands*\n\n` +
          `*Creating Complaints:*\n` +
          `/ticket - Start reporting a complaint\n` +
          `Then describe your issue in the next message\n\n` +
          `*Tracking:*\n` +
          `/mytickets - See all your complaints\n` +
          `/status TKT-XXXXX - Check specific complaint\n\n` +
          `*Examples:*\n` +
          `1️⃣ Send: /ticket\n` +
          `2️⃣ Then: "Large pothole on Main Street"\n\n` +
          `Need more help? Contact support! 🆘`
        );
        break;

      case '/ticket':
        if (args.trim()) {
          // Store query and ask for images
          userStates.set(userId, { 
            state: 'awaiting_image_confirmation',
            query: args,
            images: []
          });
          await sendWhatsAppMessage(from,
            `📸🎥 *Would you like to add photos or videos to your complaint?*\n\n` +
            `"${args}"\n\n` +
            `Visual evidence helps us resolve issues faster!\n\n` +
            `✅ Reply "yes" to upload media\n` +
            `❌ Reply "no" to skip and create ticket\n` +
            `🚫 Send /cancel to cancel`
          );
        } else {
          // Enter ticket creation mode
          userStates.set(userId, { state: 'awaiting_ticket' });
          await sendWhatsAppMessage(from,
            `📝 *Report Municipal Complaint*\n\n` +
            `Please describe your complaint in detail:\n\n` +
            `Include:\n` +
            `• What is the issue?\n` +
            `• Where is the location?\n` +
            `• How urgent is it?\n\n` +
            `Example: "Large pothole on Main Street near City Hall, causing traffic issues"\n\n` +
            `Type /cancel to cancel`
          );
        }
        break;

      case '/mytickets':
        const tickets = await getUserTickets(userId);
        if (tickets.length === 0) {
          await sendWhatsAppMessage(from,
            `📭 *No Complaints Found*\n\nYou haven't reported any complaints yet.\n\nUse /ticket to report your first complaint!`
          );
        } else {
          let response = `📋 *Your Complaints (${tickets.length})*\n\n`;
          tickets.slice(0, 10).forEach((ticket, index) => {
            const statusEmoji = ticket.status === 'open' ? '🔴' : 
                              ticket.status === 'in-progress' ? '🟡' : '✅';
            response += `${index + 1}. ${statusEmoji} *${ticket.ticketId}*\n`;
            response += `   ${ticket.query.substring(0, 50)}${ticket.query.length > 50 ? '...' : ''}\n`;
            response += `   Status: ${ticket.status.toUpperCase()}\n\n`;
          });
          response += `\n💡 Use /status ${tickets[0].ticketId} to see details`;
          await sendWhatsAppMessage(from, response);
        }
        break;

      case '/status':
        if (!args.trim()) {
          await sendWhatsAppMessage(from,
            `⚠️ Please provide a complaint ID\n\nExample: /status TKT-ABC123`
          );
        } else {
          const ticket = await getTicketById(args.trim());
          if (!ticket) {
            await sendWhatsAppMessage(from,
              `❌ Complaint not found: ${args.trim()}\n\nCheck the ID and try again.`
            );
          } else {
            let response = `🎫 *Complaint Details*\n\n`;
            response += `*ID:* ${ticket.ticketId}\n`;
            response += `*Status:* ${ticket.status.toUpperCase()}\n`;
            response += `*Priority:* ${ticket.priority}\n`;
            response += `*Category:* ${ticket.category}\n`;
            response += `*Created:* ${new Date(ticket.createdAt).toLocaleDateString()}\n\n`;
            response += `*Description:*\n${ticket.query}\n\n`;
            if (ticket.response) {
              response += `*Response:*\n${ticket.response}\n\n`;
            }
            response += `${ticket.status === 'resolved' ? '✅' : '⏳'} ${
              ticket.status === 'resolved' ? 'Resolved' : 'In Progress'
            }`;
            await sendWhatsAppMessage(from, response);
          }
        }
        break;

      case '/cancel':
        userStates.delete(userId);
        await sendWhatsAppMessage(from,
          `❌ Action cancelled\n\nUse /help to see available commands`
        );
        break;

      default:
        await sendWhatsAppMessage(from,
          `❓ Unknown command: ${command}\n\nUse /help to see available commands`
        );
    }
  } catch (error) {
    console.error('WhatsApp command error:', error);
    await sendWhatsAppMessage(from,
      `⚠️ Sorry, an error occurred. Please try again or contact support.`
    );
  }
}

async function handleConversation(from, userId, messageText) {
  const userState = userStates.get(userId);

  console.log(`💬 WhatsApp text from ${userId}: "${messageText}", state:`, userState?.state);

  if (!userState) {
    // No active conversation, provide guidance
    await sendWhatsAppMessage(from,
      `👋 Hi! Use /help to see available commands\n\nOr use /ticket to report a complaint`
    );
    return;
  }

  try {
    if (userState.state === 'awaiting_ticket') {
      // Store query and ask for images
      userState.query = messageText;
      userState.state = 'awaiting_image_confirmation';
      userState.images = [];
      userStates.set(userId, userState);
      
      console.log(`✅ Query stored, asking for image confirmation`);
      
        await sendWhatsAppMessage(from,
        `📸🎥 *Would you like to add photos or videos to your complaint?*\n\n` +
        `"${messageText}"\n\n` +
        `Visual evidence helps us resolve issues faster!\n\n` +
        `✅ Reply "yes" to upload media\n` +
        `❌ Reply "no" to skip and create ticket\n` +
        `🚫 Send /cancel to cancel`
      );
    } else if (userState.state === 'awaiting_image_confirmation') {
      const response = messageText.toLowerCase().trim();
      console.log(`🤔 WhatsApp user response to image confirmation: ${response}`);
      
      if (response === 'yes' || response === 'y') {
        userState.state = 'collecting_images';
        userStates.set(userId, userState);
        
        console.log(`✅ State changed to collecting_images for WhatsApp user ${userId}`);
        
        await sendWhatsAppMessage(from,
          `📸🎥 *Great! Send your photos or videos now.*\n\n` +
          `⚠️ *Note:* WhatsApp API has limitations. Please send media files one at a time.\n\n` +
          `• You can send up to 3 media files (photos/videos)\n` +
          `• When done, reply "done"\n` +
          `• To cancel, send /cancel`
        );
      } else if (response === 'no' || response === 'n') {
        console.log(`❌ WhatsApp user declined images, creating ticket without photos`);
        // Create ticket without images
        await createTicketWithImagesWhatsApp(from, userId, userState);
      } else {
        await sendWhatsAppMessage(from, 'Please reply with "yes" or "no"');
      }
    } else if (userState.state === 'collecting_images') {
      if (messageText.toLowerCase().trim() === 'done' || messageText.toLowerCase().trim() === 'd') {
        console.log(`✅ WhatsApp user finished uploading, image count: ${userState.images.length}`);
        await createTicketWithImagesWhatsApp(from, userId, userState);
      } else {
        await sendWhatsAppMessage(from, 
          `📸🎥 Please send photos/videos or type "done" when finished.\n\n` +
          `Media uploaded: ${userState.images.length}/3`
        );
      }
    }
  } catch (error) {
    console.error('WhatsApp conversation error:', error);
    await sendWhatsAppMessage(from,
      `⚠️ Sorry, something went wrong. Please try again.`
    );
    userStates.delete(userId);
  }
}

async function createTicketWithImagesWhatsApp(from, userId, userState) {
  try {
    await sendWhatsAppMessage(from, '⏳ Creating your complaint...');

    // Create the ticket first
    const ticket = await createTicket(userId, 'WhatsApp User', '', '', userState.query, 'general');
    
    // Upload images if any
    let imageUploadResults = [];
    if (userState.images && userState.images.length > 0) {
      await sendWhatsAppMessage(from, `📤 Uploading ${userState.images.length} photo(s)...`);
      
      for (const imageData of userState.images) {
        try {
          const file = {
            buffer: imageData.buffer,
            originalname: imageData.filename,
            mimetype: imageData.mimetype,
            size: imageData.buffer.length
          };
          
          const result = await uploadImage(file, userId, ticket.ticketId);
          imageUploadResults.push(result);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
        }
      }
    }

    // Clear user state
    userStates.delete(userId);

    // Send success message
    await sendWhatsAppMessage(from,
      `✅ *Complaint Registered Successfully!*\n\n` +
      `*Complaint ID:* ${ticket.ticketId}\n` +
      `*Query:* ${userState.query}\n` +
      `*Status:* ${ticket.status.toUpperCase()}\n` +
      `*Priority:* ${ticket.priority}\n` +
      `${imageUploadResults.length > 0 ? `📸🎥 *Media:* ${imageUploadResults.length} file(s) uploaded\n` : ''}` +
      `\n🤖 *Automatically Analyzed by AI*\n` +
      `Your complaint has been analyzed and routed to the appropriate department automatically!\n\n` +
      `Use /status ${ticket.ticketId} to track your complaint\n` +
      `Use /mytickets to see all your complaints`
    );
  } catch (error) {
    console.error('WhatsApp ticket creation error:', error);
    await sendWhatsAppMessage(from,
      `❌ Failed to create complaint. Please try again or contact support.`
    );
    userStates.delete(userId);
  }
}

module.exports = { 
  initTwilioClient, 
  handleIncomingMessage,
  sendWhatsAppMessage 
};
