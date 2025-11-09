const { supabase } = require('../config/supabaseClient');

// Initialize services with error handling
let expo = null;
let telegramBot = null;
let twilioClient = null;

// Initialize Expo SDK for FCM push notifications
try {
  const { Expo } = require('expo-server-sdk');
  if (process.env.EXPO_ACCESS_TOKEN) {
    expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true,
    });
  }
} catch (error) {
  console.warn('Expo SDK not available:', error.message);
}

// Initialize Telegram Bot
try {
  const TelegramBot = require('node-telegram-bot-api');
  if (process.env.TELEGRAM_BOT_TOKEN) {
    telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  }
} catch (error) {
  console.warn('Telegram Bot not available:', error.message);
}

// Initialize Twilio for WhatsApp
try {
  const twilio = require('twilio');
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.warn('Twilio not available:', error.message);
}

// Get subscriber statistics
const getSubscriberStats = async (req, res) => {
  try {
    // Get all users with notification preferences
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, fcm_token, telegram_chat_id, whatsapp_number, notification_preferences, is_active')
      .eq('is_active', true);

    if (allUsersError) throw allUsersError;

    // Count subscribers who have enabled each channel in their preferences
    let inAppCount = 0;
    let telegramCount = 0;
    let whatsappCount = 0;

    allUsers.forEach(user => {
      const prefs = user.notification_preferences || {};
      
      // Count in-app subscribers: have FCM token AND push preference enabled
      if (user.fcm_token && prefs.push !== false) {
        inAppCount++;
      }
      
      // Count Telegram subscribers: have chat_id AND telegram preference enabled
      if (user.telegram_chat_id && prefs.telegram !== false) {
        telegramCount++;
      }
      
      // Count WhatsApp subscribers: have number AND whatsapp preference enabled
      if (user.whatsapp_number && prefs.whatsapp !== false) {
        whatsappCount++;
      }
    });

    res.json({
      success: true,
      subscribers: {
        inApp: inAppCount,
        telegram: telegramCount,
        whatsapp: whatsappCount,
        total: allUsers?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error getting subscriber stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscriber statistics',
      error: error.message,
    });
  }
};

// Get notification history
const getNotificationHistory = async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      success: true,
      notifications: notifications || [],
    });
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification history',
      error: error.message,
    });
  }
};

// Send broadcast notification to all subscribers (SIMPLE VERSION - NO SCHEMA CONFLICTS)
const sendBroadcastNotification = async (req, res) => {
  try {
    const { title, message, category, priority, channels } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required',
      });
    }

    console.log(`📢 Broadcasting: "${title}" to channels: ${channels?.join(', ') || 'all'}`);

    let totalSent = 0;
    const results = {
      telegram: { sent: 0, failed: 0 },
      whatsapp: { sent: 0, failed: 0 },
    };

    // Send to Telegram users (if enabled)
    // Send to ALL users who have started the bot (have telegram_chat_id)
    if ((!channels || channels.includes('telegram')) && telegramBot) {
      try {
        // Get all users with telegram_chat_id (users who have started the bot)
        const { data: telegramUsers, error: telegramError } = await supabase
          .from('users')
          .select('telegram_chat_id, name')
          .not('telegram_chat_id', 'is', null);

        if (telegramError) throw telegramError;

        if (telegramUsers && telegramUsers.length > 0) {
          const formattedMessage = `🔔 *${title}*\n\n${message}`;
          
          console.log(`📢 Sending to ${telegramUsers.length} Telegram users...`);
          
          // Send to all users (same way bot sends messages)
          for (const user of telegramUsers) {
            try {
              await telegramBot.sendMessage(user.telegram_chat_id, formattedMessage, {
                parse_mode: 'Markdown',
              });
              results.telegram.sent++;
              totalSent++;
              console.log(`✅ Sent to ${user.name || 'user'} (chat_id: ${user.telegram_chat_id})`);
            } catch (error) {
              console.error(`❌ Failed to send to chat_id ${user.telegram_chat_id}:`, error.message);
              results.telegram.failed++;
            }
          }
          
          console.log(`✅ Telegram broadcast complete: ${results.telegram.sent} sent, ${results.telegram.failed} failed`);
        } else {
          console.warn('⚠️ No Telegram users found. Users need to start the bot first (/start)');
        }
      } catch (error) {
        console.error('Telegram broadcast error:', error);
      }
    }

    // Send to WhatsApp users (if enabled)
    if ((!channels || channels.includes('whatsapp')) && twilioClient) {
      try {
        const { data: whatsappUsers } = await supabase
          .from('users')
          .select('whatsapp_number')
          .not('whatsapp_number', 'is', null)
          .eq('is_active', true);

        if (whatsappUsers) {
          for (const user of whatsappUsers) {
            try {
              await twilioClient.messages.create({
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:${user.whatsapp_number}`,
                body: `🔔 ${title}\n\n${message}`,
              });
              results.whatsapp.sent++;
              totalSent++;
            } catch (error) {
              console.error(`Failed to send to WhatsApp ${user.whatsapp_number}:`, error.message);
              results.whatsapp.failed++;
            }
          }
        }
      } catch (error) {
        console.error('WhatsApp broadcast error:', error);
      }
    }

    // Store in database for history (SIMPLE - no complex schema)
    try {
      await supabase
        .from('notifications')
        .insert({
          title,
          message,
          category: category || 'alert',
          priority: priority || 'medium',
          channels: channels || ['telegram', 'whatsapp'],
          status: 'sent',
          sent_count: totalSent,
          delivery_results: results,
        });
    } catch (dbError) {
      console.error('Failed to store notification:', dbError.message);
      // Don't fail the request
    }

    // Emit real-time update via Socket.IO
    if (global.io) {
      global.io.emit('notification_sent', {
        title,
        message,
        sent_count: totalSent,
        results,
      });
    }

    res.json({
      success: true,
      message: 'Notification sent successfully',
      sent_count: totalSent,
      results,
    });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message,
    });
  }
};

// Send test notification
const sendTestNotification = async (req, res) => {
  try {
    const { channel, token } = req.body;

    if (!channel || !token) {
      return res.status(400).json({
        success: false,
        message: 'Channel and token/recipient are required',
      });
    }

    const testTitle = '🧪 Test Notification';
    const testMessage = 'This is a test notification from Smart City Dashboard. If you receive this, your notification system is working correctly!';

    let result = { success: false, message: '' };

    switch (channel) {
      case 'inApp':
        if (Expo.isExpoPushToken(token)) {
          const message = {
            to: token,
            sound: 'default',
            title: testTitle,
            body: testMessage,
            data: { test: true },
          };
          const ticket = await expo.sendPushNotificationsAsync([message]);
          result = {
            success: ticket[0].status === 'ok',
            message: ticket[0].status === 'ok' ? 'Test notification sent' : 'Failed to send',
            details: ticket[0],
          };
        } else {
          result = { success: false, message: 'Invalid Expo push token' };
        }
        break;

      case 'telegram':
        await telegramBot.sendMessage(token, `🔔 *${testTitle}*\n\n${testMessage}`, {
          parse_mode: 'Markdown',
        });
        result = { success: true, message: 'Test Telegram message sent' };
        break;

      case 'whatsapp':
        if (twilioClient) {
          await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${token}`,
            body: `🔔 ${testTitle}\n\n${testMessage}`,
          });
          result = { success: true, message: 'Test WhatsApp message sent' };
        } else {
          result = { success: false, message: 'Twilio not configured' };
        }
        break;

      default:
        result = { success: false, message: 'Invalid channel' };
    }

    res.json(result);
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message,
    });
  }
};

module.exports = {
  getSubscriberStats,
  getNotificationHistory,
  sendBroadcastNotification,
  sendTestNotification,
};
