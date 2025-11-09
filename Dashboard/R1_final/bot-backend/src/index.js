require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { Telegraf } = require('telegraf');
const { testConnection } = require('./config/supabaseClient');
const ticketRoutes = require('./routes/ticketRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const imageRoutes = require('./routes/imageRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const workerRoutes = require('./routes/workerRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const initializeBotHandlers = require('./botHandlers');
const { initTwilioClient, handleIncomingMessage } = require('./twilioWhatsappHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio webhook

// Make io available to routes
app.set('io', io);

// Test Supabase Connection
testConnection();

// Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
initializeBotHandlers(bot);

// Start Telegram bot polling
bot.launch();
console.log('🤖 Telegram Bot started successfully');

// Initialize Twilio WhatsApp (Official API)
const twilioClient = initTwilioClient();
if (twilioClient) {
  console.log('📱 Twilio WhatsApp integration initialized');
} else {
  console.log('⚠️ Twilio WhatsApp not configured - set credentials in .env');
}

// Routes
app.use('/api', ticketRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api', workerRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api', emergencyRoutes); // Emergency broadcast routes
app.use('/api/upload', uploadRoutes); // Image upload routes
app.use('/api/notifications', notificationRoutes); // Push notification routes

// Twilio WhatsApp webhook endpoint
app.post('/webhook/whatsapp', handleIncomingMessage);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Bot backend is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Municipal Services Bot Backend API',
    version: '2.0.0',
    database: 'Supabase (PostgreSQL)',
    platforms: ['Telegram', 'WhatsApp (Twilio Official API)'],
    realtime: 'Socket.IO',
    status: 'running',
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Dashboard client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Dashboard client disconnected:', socket.id);
  });
});

// NOTE: Ticket routes are handled by routes/ticketRoutes.js
// Avoid defining duplicate /api/tickets routes here to prevent conflicts and 500s.

// Export io for use in other modules
global.io = io;

// Start Express server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🖼️ Image API at http://localhost:${PORT}/api/images`);
  console.log(`🔌 Socket.IO ready for real-time notifications`);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
