const express = require('express');
const router = express.Router();
const { transcribeImage, analyzeTicket, safetyCheck } = require('../controllers/geminiController');

// Transcribe image using Gemini Vision API
router.post('/transcribe', transcribeImage);

// Analyze ticket with custom query
router.post('/analyze', analyzeTicket);

// Safety check for a place (Chhattisgarh)
router.post('/safety-check', safetyCheck);

module.exports = router;
