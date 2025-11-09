const { supabase } = require('../config/supabaseClient');
const { Telegraf } = require('telegraf');
const twilio = require('twilio');

// Initialize services (same as notificationController)
let telegramBot = null;
let twilioClient = null;

// Initialize Telegram Bot
try {
  if (process.env.TELEGRAM_BOT_TOKEN) {
    telegramBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  }
} catch (error) {
  console.warn('Telegram Bot not available:', error.message);
}

// Initialize Twilio for WhatsApp
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.warn('Twilio not available:', error.message);
}

/**
 * Send simple direct notification (like ticket closed message)
 * Just sends the message to users - no complex logic
 */
async function sendSimpleBroadcast({ title, message, channels = ['telegram', 'whatsapp'] }) {
  const results = {
    telegram: { sent: 0, failed: 0 },
    whatsapp: { sent: 0, failed: 0 },
  };

  try {
    // Format message
    const formattedMessage = `🔔 *${title}*\n\n${message}`;

    // Send to Telegram users
    if (channels.includes('telegram') && telegramBot) {
      const { data: telegramUsers } = await supabase
        .from('users')
        .select('telegram_chat_id, notification_preferences')
        .not('telegram_chat_id', 'is', null)
        .eq('is_active', true);

      if (telegramUsers) {
        for (const user of telegramUsers) {
          const prefs = user.notification_preferences || {};
          if (prefs.telegram !== false) {
            try {
              await telegramBot.telegram.sendMessage(user.telegram_chat_id, formattedMessage, {
                parse_mode: 'Markdown',
              });
              results.telegram.sent++;
            } catch (error) {
              console.error(`Failed to send to Telegram ${user.telegram_chat_id}:`, error.message);
              results.telegram.failed++;
            }
          }
        }
      }
    }

    // Send to WhatsApp users
    if (channels.includes('whatsapp') && twilioClient) {
      const { data: whatsappUsers } = await supabase
        .from('users')
        .select('whatsapp_number, notification_preferences')
        .not('whatsapp_number', 'is', null)
        .eq('is_active', true);

      if (whatsappUsers) {
        for (const user of whatsappUsers) {
          const prefs = user.notification_preferences || {};
          if (prefs.whatsapp !== false) {
            try {
              await twilioClient.messages.create({
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:${user.whatsapp_number}`,
                body: `${title}\n\n${message}`,
              });
              results.whatsapp.sent++;
            } catch (error) {
              console.error(`Failed to send to WhatsApp ${user.whatsapp_number}:`, error.message);
              results.whatsapp.failed++;
            }
          }
        }
      }
    }

    console.log(`✅ Broadcast sent: Telegram ${results.telegram.sent}, WhatsApp ${results.whatsapp.sent}`);

    return {
      success: true,
      results,
      totalSent: results.telegram.sent + results.whatsapp.sent,
    };
  } catch (error) {
    console.error('Error sending broadcast:', error);
    return {
      success: false,
      error: error.message,
      results,
    };
  }
}

/**
 * Send notification to single user (like ticket closed)
 */
async function sendDirectNotification(userId, title, message) {
  try {
    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('telegram_chat_id, whatsapp_number, notification_preferences')
      .eq('id', userId)
      .single();

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const formattedMessage = `🔔 *${title}*\n\n${message}`;
    let sent = false;

    // Send to Telegram
    if (user.telegram_chat_id && telegramBot) {
      const prefs = user.notification_preferences || {};
      if (prefs.telegram !== false) {
        try {
          await telegramBot.telegram.sendMessage(user.telegram_chat_id, formattedMessage, {
            parse_mode: 'Markdown',
          });
          sent = true;
        } catch (error) {
          console.error('Failed to send Telegram notification:', error.message);
        }
      }
    }

    // Send to WhatsApp
    if (user.whatsapp_number && twilioClient) {
      const prefs = user.notification_preferences || {};
      if (prefs.whatsapp !== false) {
        try {
          await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${user.whatsapp_number}`,
            body: `${title}\n\n${message}`,
          });
          sent = true;
        } catch (error) {
          console.error('Failed to send WhatsApp notification:', error.message);
        }
      }
    }

    return { success: sent };
  } catch (error) {
    console.error('Error sending direct notification:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendSimpleBroadcast,
  sendDirectNotification,
};
