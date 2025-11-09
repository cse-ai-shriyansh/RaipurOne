const { Telegraf } = require('telegraf');
const { createTicket, getUserTickets } = require('./controllers/ticketController.js');
const { uploadImage } = require('./controllers/imageController.js');
const { supabase } = require('./config/supabaseClient');
const axios = require('axios');

// Store user conversation states
const userStates = new Map();

// Auto-register user when they message
const autoRegisterUser = async (ctx) => {
  const user = ctx.from;
  const chatId = ctx.chat.id;

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_chat_id', chatId)
      .single();

    if (!existingUser) {
      // Create new user
      await supabase
        .from('users')
        .insert([
          {
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Telegram User',
            telegram_chat_id: chatId,
            telegram_username: user.username,
            notification_preferences: {
              telegram: true,
              whatsapp: false,
              push: false
            },
            is_active: true,
          },
        ]);

      console.log(`✅ Auto-registered Telegram user: ${user.username || chatId}`);
    }
  } catch (error) {
    console.error('Error auto-registering user:', error);
  }
};

const initializeBotHandlers = (bot) => {
  // Auto-register user on any message
  bot.use(async (ctx, next) => {
    await autoRegisterUser(ctx);
    return next();
  });

  // /start command handler
  bot.start(async (ctx) => {
    const user = ctx.from;
    const welcomeMessage = `
👋 Welcome to Smart City Support Bot!

I'm here to help you with your complaints and queries. Here are the commands you can use:

/start - Show this welcome message
/help - Get help and available commands
/ticket - Create a new complaint
/mytickets - View your existing complaints

You can also download our app for easier complaints and more features!

How can I assist you today?
    `.trim();

    await ctx.reply(welcomeMessage);
  });

  // /help command handler
  bot.help(async (ctx) => {
    const helpMessage = `
📋 Available Commands:

/start - Welcome message
/help - This help menu
/ticket - Create a new support ticket
  Usage: /ticket <your query here>
  
/mytickets - View all your support tickets

/status - Check status of all tickets
 checkout our app for easier complaint registration and tracking!

Example:
/ticket I need help with my account

    `.trim();

    await ctx.reply(helpMessage);
  });

  // /ticket command - create new ticket
  bot.command('ticket', async (ctx) => {
    try {
      const user = ctx.from;
      const query = ctx.message.text.replace('/ticket', '').trim();

      if (!query) {
        return await ctx.reply(
          '❌ Please provide your query. Usage: /ticket <your query>\n\nExample: /ticket I need help with my account'
        );
      }

      // Store user query and enter image collection state
      userStates.set(user.id.toString(), {
        state: 'awaiting_image_confirmation',
        query: query,
        username: user.username || 'anonymous',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        images: []
      });

      await ctx.reply(
        '📸 *Would you like to add photos or videos to your complaint?*\n\n' +
        'Visual evidence helps us resolve issues faster!\n\n' +
        '✅ Send "yes" to upload media (photos/videos)\n' +
        '❌ Send "no" to skip and create ticket\n' +
        '🚫 Send /cancel to cancel\n\n' +
        '💡 *Tip*: You can also share your location 📍 to help us locate the problem!',
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      console.error('Error starting ticket creation:', error);
      await ctx.reply('❌ Error creating ticket. Please try again.');
    }
  });

  // /mytickets command - view user's tickets
  bot.command('mytickets', async (ctx) => {
    try {
      const user = ctx.from;
      const tickets = await getUserTickets(user.id.toString());

      if (tickets.length === 0) {
        return await ctx.reply('📭 You have no tickets yet. Use /ticket to create one.');
      }

      let response = '📋 Your Tickets:\n\n';

      tickets.forEach((ticket, index) => {
        response += `
${index + 1}. ${ticket.ticketId}
   📝 ${ticket.query.substring(0, 50)}${ticket.query.length > 50 ? '...' : ''}
   Status: ${ticket.status.toUpperCase()}
   Created: ${new Date(ticket.createdAt).toLocaleDateString()}
`;
      });

      await ctx.reply(response);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      await ctx.reply('❌ Error fetching your tickets. Please try again.');
    }
  });

  // /status command - check ticket status
  bot.command('status', async (ctx) => {
    try {
      const user = ctx.from;
      const tickets = await getUserTickets(user.id.toString());

      if (tickets.length === 0) {
        return await ctx.reply('📭 You have no tickets yet.');
      }

      let response = '📊 Ticket Status Summary:\n\n';

      const statusCount = {
        open: 0,
        'in-progress': 0,
        resolved: 0,
        closed: 0,
      };

      tickets.forEach((ticket) => {
        statusCount[ticket.status]++;
      });

      response += `
🔵 Open: ${statusCount.open}
🟡 In Progress: ${statusCount['in-progress']}
🟢 Resolved: ${statusCount.resolved}
⚫ Closed: ${statusCount.closed}

Total Tickets: ${tickets.length}
      `.trim();

      await ctx.reply(response);
    } catch (error) {
      console.error('Error fetching status:', error);
      await ctx.reply('❌ Error fetching status. Please try again.');
    }
  });

  // /cancel command
  bot.command('cancel', async (ctx) => {
    const userId = ctx.from.id.toString();
    userStates.delete(userId);
    await ctx.reply('❌ Operation cancelled. Use /ticket to create a new complaint.');
  });

  // Handle photo uploads
  bot.on('photo', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userState = userStates.get(userId);

    console.log(`📸 Photo received from user ${userId}, state:`, userState?.state);

    if (!userState || userState.state !== 'collecting_images') {
      return await ctx.reply('📸 Please use /ticket first to start a complaint, then add photos when prompted.');
    }

    try {
      // Get the highest resolution photo
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      
      console.log(`📥 Downloading image from: ${fileLink.href}`);
      
      // Download image
      const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      
      console.log(`✅ Image downloaded, size: ${buffer.length} bytes`);
      
      // Store image info temporarily
      userState.images.push({
        buffer: buffer,
        filename: `${Date.now()}.jpg`,
        mimetype: 'image/jpeg'
      });

      // Update state
      userStates.set(userId, userState);

      await ctx.reply(
        `✅ Photo ${userState.images.length} received!\n\n` +
        `📸🎥 Send more photos/videos or send "done" to finish and create ticket.\n` +
        `Maximum 5 media files allowed.`
      );

      // Auto-create ticket if 5 images reached
      if (userState.images.length >= 5) {
        await createTicketWithImages(ctx, userId, userState);
      }

    } catch (error) {
      console.error('Error handling photo:', error);
      await ctx.reply('❌ Error uploading photo. Please try again or send "done" to create ticket without this photo.');
    }
  });

  // Handle video uploads
  bot.on('video', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userState = userStates.get(userId);

    console.log(`🎥 Video received from user ${userId}, state:`, userState?.state);

    if (!userState || userState.state !== 'collecting_images') {
      return await ctx.reply('🎥 Please use /ticket first to start a complaint, then add media when prompted.');
    }

    try {
      const video = ctx.message.video;
      
      // Check file size (max 20MB for videos)
      if (video.file_size > 20 * 1024 * 1024) {
        return await ctx.reply('❌ Video is too large. Please send videos under 20MB.');
      }

      const fileLink = await ctx.telegram.getFileLink(video.file_id);
      
      console.log(`📥 Downloading video from: ${fileLink.href}`);
      
      // Download video
      const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      
      console.log(`✅ Video downloaded, size: ${buffer.length} bytes`);
      
      // Store video info temporarily
      userState.images.push({
        buffer: buffer,
        filename: `${Date.now()}.mp4`,
        mimetype: 'video/mp4'
      });

      // Update state
      userStates.set(userId, userState);

      await ctx.reply(
        `✅ Video ${userState.images.length} received!\n\n` +
        `📸🎥 Send more photos/videos or send "done" to finish and create ticket.\n` +
        `Maximum 5 media files allowed.`
      );

      // Auto-create ticket if 5 media files reached
      if (userState.images.length >= 5) {
        await createTicketWithImages(ctx, userId, userState);
      }

    } catch (error) {
      console.error('Error handling video:', error);
      await ctx.reply('❌ Error uploading video. Please try again or send "done" to create ticket without this video.');
    }
  });

  // Handle location messages
  bot.on('location', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userState = userStates.get(userId);
    const location = ctx.message.location;

    console.log(`📍 Location received from user ${userId}: ${location.latitude}, ${location.longitude}`);

    if (!userState) {
      return await ctx.reply(
        '📍 Location received! Use /ticket to start a complaint first.\n\n' +
        'The location will be automatically attached to your complaint.'
      );
    }

    // Store location in user state
    userState.location = {
      latitude: location.latitude,
      longitude: location.longitude
    };
    userStates.set(userId, userState);

    await ctx.reply(
      `✅ Location saved!\n📍 Lat: ${location.latitude.toFixed(4)}, Long: ${location.longitude.toFixed(4)}\n\n` +
      `Continue sending photos/videos or send "done" to create ticket.`
    );
  });

  // Handle text messages (conversation flow)
  bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userState = userStates.get(userId);
    const messageText = ctx.message.text.toLowerCase().trim();

    console.log(`💬 Text message from user ${userId}: "${messageText}", state:`, userState?.state);

    // Handle conversation states
    if (userState) {
      if (userState.state === 'awaiting_image_confirmation') {
        console.log(`🤔 User response to image confirmation: ${messageText}`);
        
        if (messageText === 'yes' || messageText === 'y') {
          userState.state = 'collecting_images';
          userStates.set(userId, userState);
          
          console.log(`✅ State changed to collecting_images for user ${userId}`);
          
          await ctx.reply(
            '📸🎥 *Great! Send your photos or videos now.*\n\n' +
            '• You can send up to 5 media files (photos/videos)\n' +
            '• Send one file at a time\n' +
            '• Videos must be under 20MB\n' +
            '• When done, send "done"\n' +
            '• To cancel, send /cancel',
            { parse_mode: 'Markdown' }
          );
        } else if (messageText === 'no' || messageText === 'n') {
          console.log(`❌ User declined images, creating ticket without photos`);
          // Create ticket without images
          await createTicketWithImages(ctx, userId, userState);
        } else {
          await ctx.reply('Please reply with "yes" or "no"');
        }
      } else if (userState.state === 'collecting_images') {
        if (messageText === 'done' || messageText === 'd') {
          console.log(`✅ User finished uploading, image count: ${userState.images.length}`);
          
          if (userState.images.length === 0) {
            await ctx.reply('❌ No photos received. Send at least one photo or use /cancel to skip.');
          } else {
            await createTicketWithImages(ctx, userId, userState);
          }
        } else {
          await ctx.reply('📸🎥 Please send photos/videos or type "done" when finished.');
        }
      }
    } else {
      // No active conversation
      const message = `
I'm a Complaint Registration bot. To create a ticket, use:
/ticket <your query>

Or use /help to see all available commands.
      `.trim();
      await ctx.reply(message);
    }
  });

  // Error handler
  bot.catch((err, ctx) => {
    console.error('Bot Error:', err);
    ctx.reply('❌ An error occurred. Please try again.');
  });
};

// Helper function to create ticket with images
async function createTicketWithImages(ctx, userId, userState) {
  try {
    console.log(`🎫 Creating ticket for user ${userId} with ${userState.images.length} images`);
    
    await ctx.reply('⏳ Creating your complaint...');

    // Create the ticket first (now with location support)
    const ticket = await createTicket(
      userId,
      userState.username,
      userState.firstName,
      userState.lastName,
      userState.query,
      'general',
      userState.location?.latitude,
      userState.location?.longitude
    );

    const ticketId = ticket.ticket_id || ticket.ticketId || ticket.id;
    console.log(`✅ Ticket created: ${ticketId}`);
    
    if (userState.location) {
      console.log(`📍 Location attached: ${userState.location.latitude}, ${userState.location.longitude}`);
    }

    // Upload images if any
    let imageUploadResults = [];
    if (userState.images.length > 0) {
      await ctx.reply(`📤 Uploading ${userState.images.length} photo(s)...`);
      
      for (let i = 0; i < userState.images.length; i++) {
        const imageData = userState.images[i];
        try {
          console.log(`📤 Uploading image ${i + 1}/${userState.images.length}...`);
          
          const file = {
            buffer: imageData.buffer,
            originalname: imageData.filename,
            mimetype: imageData.mimetype,
            size: imageData.buffer.length
          };
          
          const result = await uploadImage(file, userId, ticketId);
          imageUploadResults.push(result);
          
          console.log(`✅ Image ${i + 1} uploaded successfully`);
        } catch (uploadError) {
          console.error(`❌ Error uploading image ${i + 1}:`, uploadError);
        }
      }
      
      console.log(`✅ Total images uploaded: ${imageUploadResults.length}/${userState.images.length}`);
    }

    // Clear user state
    userStates.delete(userId);

    // Send success message
    const ticketMessage = `
✅ *Complaint Created Successfully!*

📌 *Ticket ID:* ${ticketId}
📝 *Query:* ${ticket.query}
📊 *Status:* ${ticket.status.toUpperCase()}
⏰ *Created:* ${new Date(ticket.created_at).toLocaleString()}
${imageUploadResults.length > 0 ? `📸 *Photos:* ${imageUploadResults.length} uploaded` : ''}

🤖 Your complaint is being automatically analyzed and routed to the appropriate department!

We'll get back to you soon. You can check your ticket status anytime.
    `.trim();

    await ctx.reply(ticketMessage, { parse_mode: 'Markdown' });
    
    console.log(`✅ Ticket creation complete for ${ticketId}`);

  } catch (error) {
    console.error('Error creating ticket with images:', error);
    await ctx.reply('❌ Error creating ticket. Please try again with /ticket');
    userStates.delete(userId);
  }
}

module.exports = initializeBotHandlers;
