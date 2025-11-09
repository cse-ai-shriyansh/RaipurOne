const { supabase } = require('../config/supabaseClient');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { sendTelegramMessage } = require('../services/telegramService');
const { sendPushNotification } = require('../services/pushNotificationService');

/**
 * EMERGENCY BROADCAST CONTROLLER
 * Send outbreak alerts, disease spread warnings, emergency info
 */

// Create emergency broadcast
const createEmergencyBroadcast = async (req, res) => {
  try {
    const {
      title,
      message,
      severity, // 'critical', 'high', 'medium', 'low'
      category, // 'outbreak', 'disease', 'emergency', 'info'
      affected_areas, // Array of location names
      latitude,
      longitude,
      radius, // Radius in km
      image_url,
      send_telegram,
      send_whatsapp,
      send_push,
      target_users, // 'all', 'area', 'specific'
    } = req.body;

    // Validate required fields
    if (!title || !message || !severity || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, severity, and category are required',
      });
    }

    // Generate broadcast ID
    const broadcastId = `ALERT-${Date.now()}`;

    // Create broadcast record
    const broadcastData = {
      broadcast_id: broadcastId,
      title,
      message,
      severity,
      category,
      affected_areas: affected_areas || [],
      latitude: latitude || null,
      longitude: longitude || null,
      radius: radius || null,
      image_url: image_url || null,
      sent_telegram: false,
      sent_whatsapp: false,
      sent_push: false,
      target_users: target_users || 'all',
      status: 'pending',
      created_by: req.body.admin_id || 'admin',
      created_at: new Date().toISOString(),
    };

    const { data: broadcast, error: broadcastError } = await supabase
      .from('emergency_broadcasts')
      .insert([broadcastData])
      .select()
      .single();

    if (broadcastError) throw broadcastError;

    // Send to different channels
    const sendResults = {
      telegram: { sent: false, count: 0 },
      whatsapp: { sent: false, count: 0 },
      push: { sent: false, count: 0 },
    };

    // Get target users
    let targetUsers = [];
    if (target_users === 'all') {
      const { data: users } = await supabase.from('users').select('*');
      targetUsers = users || [];
    } else if (target_users === 'area' && latitude && longitude && radius) {
      // Get users in affected area (simplified - you can add geospatial queries)
      const { data: users } = await supabase.from('users').select('*');
      targetUsers = users || [];
    }

    // Format message for different channels
    const severityEmoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️',
    };

    const categoryEmoji = {
      outbreak: '🦠',
      disease: '💊',
      emergency: '🆘',
      info: '📢',
    };

    const formattedMessage = `${severityEmoji[severity]} ${categoryEmoji[category]} *${title}*\n\n${message}\n\n${
      affected_areas && affected_areas.length > 0
        ? `📍 Affected Areas: ${affected_areas.join(', ')}\n`
        : ''
    }⏰ Sent: ${new Date().toLocaleString()}\n\nID: ${broadcastId}`;

    // Send via Telegram
    if (send_telegram) {
      try {
        let telegramCount = 0;
        for (const user of targetUsers) {
          if (user.telegram_chat_id) {
            await sendTelegramMessage(user.telegram_chat_id, formattedMessage, image_url);
            telegramCount++;
          }
        }
        sendResults.telegram = { sent: true, count: telegramCount };

        // Update broadcast record
        await supabase
          .from('emergency_broadcasts')
          .update({ sent_telegram: true, telegram_count: telegramCount })
          .eq('broadcast_id', broadcastId);
      } catch (error) {
        console.error('Telegram broadcast error:', error);
      }
    }

    // Send via WhatsApp
    if (send_whatsapp) {
      try {
        let whatsappCount = 0;
        for (const user of targetUsers) {
          if (user.phone) {
            await sendWhatsAppMessage(user.phone, formattedMessage, image_url);
            whatsappCount++;
          }
        }
        sendResults.whatsapp = { sent: true, count: whatsappCount };

        await supabase
          .from('emergency_broadcasts')
          .update({ sent_whatsapp: true, whatsapp_count: whatsappCount })
          .eq('broadcast_id', broadcastId);
      } catch (error) {
        console.error('WhatsApp broadcast error:', error);
      }
    }

    // Send push notifications
    if (send_push) {
      try {
        let pushCount = 0;
        for (const user of targetUsers) {
          if (user.push_token) {
            await sendPushNotification(user.push_token, {
              title: `${severityEmoji[severity]} ${title}`,
              body: message,
              data: {
                type: 'emergency',
                broadcastId,
                severity,
                category,
                imageUrl: image_url,
              },
            });
            pushCount++;
          }
        }
        sendResults.push = { sent: true, count: pushCount };

        await supabase
          .from('emergency_broadcasts')
          .update({ sent_push: true, push_count: pushCount })
          .eq('broadcast_id', broadcastId);
      } catch (error) {
        console.error('Push notification broadcast error:', error);
      }
    }

    // Update broadcast status
    await supabase
      .from('emergency_broadcasts')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('broadcast_id', broadcastId);

    // Emit Socket.IO event for real-time dashboard update
    if (global.io) {
      global.io.emit('emergency_broadcast', {
        broadcast,
        sendResults,
      });
    }

    res.json({
      success: true,
      message: 'Emergency broadcast sent successfully',
      data: {
        broadcast,
        sendResults,
        totalUsers: targetUsers.length,
      },
    });
  } catch (error) {
    console.error('Emergency broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emergency broadcast',
      error: error.message,
    });
  }
};

// Get all broadcasts
const getAllBroadcasts = async (req, res) => {
  try {
    const { category, severity, status } = req.query;

    let query = supabase
      .from('emergency_broadcasts')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (severity) query = query.eq('severity', severity);
    if (status) query = query.eq('status', status);

    const { data: broadcasts, error } = await query.limit(50);

    if (error) throw error;

    res.json({
      success: true,
      data: broadcasts,
    });
  } catch (error) {
    console.error('Get broadcasts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch broadcasts',
      error: error.message,
    });
  }
};

// Get broadcast by ID
const getBroadcastById = async (req, res) => {
  try {
    const { broadcastId } = req.params;

    const { data: broadcast, error } = await supabase
      .from('emergency_broadcasts')
      .select('*')
      .eq('broadcast_id', broadcastId)
      .single();

    if (error) throw error;

    if (!broadcast) {
      return res.status(404).json({
        success: false,
        message: 'Broadcast not found',
      });
    }

    res.json({
      success: true,
      data: broadcast,
    });
  } catch (error) {
    console.error('Get broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch broadcast',
      error: error.message,
    });
  }
};

// Get broadcast statistics
const getBroadcastStats = async (req, res) => {
  try {
    const { data: broadcasts, error } = await supabase
      .from('emergency_broadcasts')
      .select('*');

    if (error) throw error;

    const stats = {
      total: broadcasts.length,
      bySeverity: {
        critical: broadcasts.filter((b) => b.severity === 'critical').length,
        high: broadcasts.filter((b) => b.severity === 'high').length,
        medium: broadcasts.filter((b) => b.severity === 'medium').length,
        low: broadcasts.filter((b) => b.severity === 'low').length,
      },
      byCategory: {
        outbreak: broadcasts.filter((b) => b.category === 'outbreak').length,
        disease: broadcasts.filter((b) => b.category === 'disease').length,
        emergency: broadcasts.filter((b) => b.category === 'emergency').length,
        info: broadcasts.filter((b) => b.category === 'info').length,
      },
      byStatus: {
        pending: broadcasts.filter((b) => b.status === 'pending').length,
        sent: broadcasts.filter((b) => b.status === 'sent').length,
        failed: broadcasts.filter((b) => b.status === 'failed').length,
      },
      totalReach: {
        telegram: broadcasts.reduce((sum, b) => sum + (b.telegram_count || 0), 0),
        whatsapp: broadcasts.reduce((sum, b) => sum + (b.whatsapp_count || 0), 0),
        push: broadcasts.reduce((sum, b) => sum + (b.push_count || 0), 0),
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

module.exports = {
  createEmergencyBroadcast,
  getAllBroadcasts,
  getBroadcastById,
  getBroadcastStats,
};
