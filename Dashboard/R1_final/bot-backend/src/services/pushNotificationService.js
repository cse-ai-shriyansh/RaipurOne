const { Expo } = require('expo-server-sdk');

const expo = new Expo();

/**
 * Send push notification via Expo
 */
const sendPushNotification = async (pushToken, notification) => {
  try {
    // Check if push token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`❌ Invalid Expo push token: ${pushToken}`);
      return {
        success: false,
        error: 'Invalid push token',
      };
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title: notification.title || 'RaipurOne Alert',
      body: notification.body,
      data: notification.data || {},
      priority: notification.priority || 'high',
      badge: notification.badge || 1,
    };

    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Push notification chunk error:', error);
      }
    }

    console.log(`✅ Push notification sent: ${tickets.length} tickets`);
    return {
      success: true,
      tickets,
    };
  } catch (error) {
    console.error('❌ Push notification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send push notifications to multiple users
 */
const sendBulkPushNotifications = async (pushTokens, notification) => {
  try {
    const messages = pushTokens
      .filter((token) => Expo.isExpoPushToken(token))
      .map((token) => ({
        to: token,
        sound: 'default',
        title: notification.title || 'RaipurOne Alert',
        body: notification.body,
        data: notification.data || {},
        priority: notification.priority || 'high',
        badge: notification.badge || 1,
      }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Bulk push notification chunk error:', error);
      }
    }

    console.log(`✅ Bulk push notifications sent: ${tickets.length} tickets`);
    return {
      success: true,
      tickets,
      total: tickets.length,
    };
  } catch (error) {
    console.error('❌ Bulk push notification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check push notification receipts
 */
const checkPushReceipts = async (ticketIds) => {
  try {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
    const receipts = [];

    for (const chunk of receiptIdChunks) {
      try {
        const receiptsChunk = await expo.getPushNotificationReceiptsAsync(chunk);
        receipts.push(receiptsChunk);
      } catch (error) {
        console.error('❌ Receipt check error:', error);
      }
    }

    return {
      success: true,
      receipts,
    };
  } catch (error) {
    console.error('❌ Check receipts error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  checkPushReceipts,
};
