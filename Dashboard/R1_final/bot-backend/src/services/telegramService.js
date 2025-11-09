const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

/**
 * Send Telegram message
 */
const sendTelegramMessage = async (chatId, message, photoUrl = null) => {
  try {
    if (photoUrl) {
      // Send photo with caption
      await bot.sendPhoto(chatId, photoUrl, {
        caption: message,
        parse_mode: 'Markdown',
      });
    } else {
      // Send text message
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    }

    console.log(`✅ Telegram message sent to ${chatId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Telegram send error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send Telegram location (for affected areas map)
 */
const sendTelegramLocation = async (chatId, latitude, longitude, title = 'Affected Area') => {
  try {
    await bot.sendLocation(chatId, latitude, longitude);
    
    // Send venue info if title provided
    if (title) {
      await bot.sendVenue(chatId, latitude, longitude, title, '');
    }

    console.log(`✅ Telegram location sent to ${chatId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Telegram location error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Broadcast to multiple users
 */
const broadcastTelegram = async (userChatIds, message, photoUrl = null) => {
  const results = [];
  
  for (const chatId of userChatIds) {
    const result = await sendTelegramMessage(chatId, message, photoUrl);
    results.push({ chatId, ...result });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

module.exports = {
  sendTelegramMessage,
  sendTelegramLocation,
  broadcastTelegram,
  bot,
};
