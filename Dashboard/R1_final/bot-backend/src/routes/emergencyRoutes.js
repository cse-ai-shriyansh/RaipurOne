const express = require('express');
const router = express.Router();
const {
  createEmergencyBroadcast,
  getAllBroadcasts,
  getBroadcastById,
  getBroadcastStats,
} = require('../controllers/emergencyController');

// POST - Create and send emergency broadcast
router.post('/emergency/broadcast', createEmergencyBroadcast);

// GET - Get all broadcasts
router.get('/emergency/broadcasts', getAllBroadcasts);

// GET - Get broadcast by ID
router.get('/emergency/broadcasts/:broadcastId', getBroadcastById);

// GET - Get broadcast statistics
router.get('/emergency/stats', getBroadcastStats);

module.exports = router;
