const { Telegraf } = require('telegraf');
const twilio = require('twilio');
const { supabase } = require('../config/supabaseClient');

// Initialize services
const telegramBot = process.env.TELEGRAM_BOT_TOKEN 
  ? new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
  : null;

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Send notification across all platforms
 */
async function sendNotification({ type, ...data }) {
  const notifications = [];

  switch (type) {
    case 'worker_assignment':
      notifications.push(
        sendWorkerAssignmentNotification(data),
        sendTelegramWorkerNotification(data),
        sendWhatsAppWorkerNotification(data)
      );
      break;

    case 'work_completed':
      notifications.push(
        sendCompletionNotification(data),
        sendTelegramCompletionNotification(data),
        sendWhatsAppCompletionNotification(data)
      );
      break;

    case 'new_complaint':
      notifications.push(
        sendAdminNewComplaintNotification(data)
      );
      break;

    case 'task_cancelled':
      notifications.push(
        sendTaskCancellationNotification(data)
      );
      break;

    default:
      console.warn(`Unknown notification type: ${type}`);
  }

  // Send all notifications in parallel
  const results = await Promise.allSettled(notifications);
  
  // Log results
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Notification ${index} failed:`, result.reason);
    }
  });

  return results;
}

/**
 * Send worker assignment notification to worker's app
 */
async function sendWorkerAssignmentNotification(data) {
  const { workerId, ticketId, message, location, images, deadline } = data;

  try {
    // Store notification in database for app to fetch
    await supabase.from('notifications').insert({
      user_id: workerId,
      user_type: 'worker',
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: message,
      data: {
        ticketId,
        location,
        images,
        deadline,
      },
      created_at: new Date().toISOString(),
      read: false,
    });

    console.log(`✅ Worker assignment notification sent to ${workerId}`);
  } catch (error) {
    console.error('Error sending worker assignment notification:', error);
    throw error;
  }
}

/**
 * Send Telegram notification to worker
 */
async function sendTelegramWorkerNotification(data) {
  if (!telegramBot) {
    console.warn('Telegram bot not configured');
    return;
  }

  const { workerId, ticketId, message, location, images, deadline } = data;

  try {
    // Get worker's Telegram chat ID
    const { data: worker } = await supabase
      .from('workers')
      .select('telegram_chat_id')
      .eq('worker_id', workerId)
      .single();

    if (!worker?.telegram_chat_id) {
      console.warn(`Worker ${workerId} has no Telegram chat ID`);
      return;
    }

    let messageText = `🔔 *New Task Assigned*\n\n`;
    messageText += `📋 Ticket: \`${ticketId}\`\n`;
    messageText += `📝 ${message}\n\n`;

    if (location) {
      messageText += `📍 Location: ${typeof location === 'string' ? location : 'Provided'}\n`;
    }

    if (deadline) {
      messageText += `⏰ Deadline: ${new Date(deadline).toLocaleString()}\n`;
    }

    messageText += `\n👉 Open the app to view full details and accept the task.`;

    await telegramBot.telegram.sendMessage(worker.telegram_chat_id, messageText, {
      parse_mode: 'Markdown',
    });

    // Send images if available
    if (images && images.length > 0) {
      for (const image of images.slice(0, 3)) {
        await telegramBot.telegram.sendPhoto(worker.telegram_chat_id, image.url || image);
      }
    }

    console.log(`✅ Telegram notification sent to worker ${workerId}`);
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    throw error;
  }
}

/**
 * Send WhatsApp notification to worker
 */
async function sendWhatsAppWorkerNotification(data) {
  if (!twilioClient) {
    console.warn('Twilio/WhatsApp not configured');
    return;
  }

  const { workerPhone, ticketId, message, deadline } = data;

  if (!workerPhone) {
    console.warn('Worker phone number not provided');
    return;
  }

  try {
    let messageBody = `🔔 *New Task Assigned*\n\n`;
    messageBody += `📋 Ticket: ${ticketId}\n`;
    messageBody += `📝 ${message}\n\n`;

    if (deadline) {
      messageBody += `⏰ Deadline: ${new Date(deadline).toLocaleString()}\n`;
    }

    messageBody += `\nOpen the NavonMesh app to view full details.`;

    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${workerPhone}`,
      body: messageBody,
    });

    console.log(`✅ WhatsApp notification sent to ${workerPhone}`);
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    throw error;
  }
}

/**
 * Send work completion notification to user
 */
async function sendCompletionNotification(data) {
  const { ticketId, userId, proofUrls } = data;

  try {
    // Store notification in database
    await supabase.from('notifications').insert({
      user_id: userId,
      user_type: 'citizen',
      type: 'work_completed',
      title: 'Work Completed',
      message: `Your complaint (${ticketId}) has been resolved!`,
      data: {
        ticketId,
        proofUrls,
      },
      created_at: new Date().toISOString(),
      read: false,
    });

    console.log(`✅ Completion notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending completion notification:', error);
    throw error;
  }
}

/**
 * Send Telegram completion notification to user
 */
async function sendTelegramCompletionNotification(data) {
  if (!telegramBot) return;

  const { ticketId, userId, proofUrls } = data;

  try {
    // Get user's Telegram chat ID from ticket
    const { data: ticket } = await supabase
      .from('tickets')
      .select('chat_id')
      .eq('ticketId', ticketId)
      .single();

    if (!ticket?.chat_id) {
      console.warn(`No Telegram chat ID for ticket ${ticketId}`);
      return;
    }

    let messageText = `✅ *Work Completed!*\n\n`;
    messageText += `Your complaint \`${ticketId}\` has been resolved.\n\n`;
    messageText += `📸 Proof of completion is attached below.\n`;
    messageText += `\nThank you for using NavonMesh! 🙏`;

    await telegramBot.telegram.sendMessage(ticket.chat_id, messageText, {
      parse_mode: 'Markdown',
    });

    // Send proof images
    if (proofUrls && proofUrls.length > 0) {
      for (const proof of proofUrls.slice(0, 5)) {
        if (proof.type === 'image') {
          await telegramBot.telegram.sendPhoto(ticket.chat_id, proof.url);
        }
      }
    }

    console.log(`✅ Telegram completion notification sent for ${ticketId}`);
  } catch (error) {
    console.error('Error sending Telegram completion notification:', error);
    throw error;
  }
}

/**
 * Send WhatsApp completion notification to user
 */
async function sendWhatsAppCompletionNotification(data) {
  if (!twilioClient) return;

  const { ticketId, userPhone } = data;

  if (!userPhone) {
    console.warn('User phone number not provided');
    return;
  }

  try {
    let messageBody = `✅ *Work Completed!*\n\n`;
    messageBody += `Your complaint (${ticketId}) has been resolved.\n\n`;
    messageBody += `You can view the proof of completion in the NavonMesh app.\n\n`;
    messageBody += `Thank you for using NavonMesh! 🙏`;

    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${userPhone}`,
      body: messageBody,
    });

    console.log(`✅ WhatsApp completion notification sent to ${userPhone}`);
  } catch (error) {
    console.error('Error sending WhatsApp completion notification:', error);
    throw error;
  }
}

/**
 * Send new complaint notification to admin
 */
async function sendAdminNewComplaintNotification(data) {
  const { ticketId, query, priority, department } = data;

  try {
    // Store notification for admin dashboard
    await supabase.from('notifications').insert({
      user_type: 'admin',
      type: 'new_complaint',
      title: 'New Complaint Received',
      message: query,
      data: {
        ticketId,
        priority,
        department,
      },
      created_at: new Date().toISOString(),
      read: false,
    });

    console.log(`✅ Admin notification sent for ticket ${ticketId}`);
  } catch (error) {
    console.error('Error sending admin notification:', error);
    throw error;
  }
}

/**
 * Send task cancellation notification
 */
async function sendTaskCancellationNotification(data) {
  const { ticketId, workerId, reason } = data;

  try {
    await supabase.from('notifications').insert({
      user_type: 'admin',
      type: 'task_cancelled',
      title: 'Task Cancelled by Worker',
      message: `Worker cancelled task for ticket ${ticketId}. Reason: ${reason}`,
      data: {
        ticketId,
        workerId,
        reason,
      },
      created_at: new Date().toISOString(),
      read: false,
    });

    console.log(`✅ Cancellation notification sent for ticket ${ticketId}`);
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
    throw error;
  }
}

module.exports = {
  sendNotification,
};
