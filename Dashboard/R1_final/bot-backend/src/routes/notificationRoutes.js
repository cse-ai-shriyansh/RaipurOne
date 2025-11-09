const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Get subscriber statistics
router.get('/subscribers', notificationController.getSubscriberStats);

// Get notification history
router.get('/history', notificationController.getNotificationHistory);

// Send notification to all subscribers
router.post('/send', notificationController.sendBroadcastNotification);

// Test notification endpoint
router.post('/test', notificationController.sendTestNotification);

module.exports = router;
