const mongoose = require('mongoose');

let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY = 1000;

const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
};

const connectWithRetry = async (delay = INITIAL_RETRY_DELAY) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-bot-db';
  
  try {
    await mongoose.connect(mongoURI, connectionOptions);
    console.log('✅ MongoDB Connected Successfully');
    connectionAttempts = 0;
    return true;
  } catch (error) {
    connectionAttempts++;
    console.error(`❌ MongoDB Connection Error (Attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS}):`, error.message);
    
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      const nextDelay = delay * Math.pow(2, connectionAttempts - 1);
      console.log(`🔄 Retrying connection in ${nextDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, nextDelay));
      return connectWithRetry(delay);
    } else {
      console.error('❌ Max retry attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 Mongoose connection disconnected');
  
  if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
    console.log('🔄 Attempting to reconnect...');
    connectWithRetry();
  }
});

process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

const connectDB = async () => {
  return connectWithRetry();
};

module.exports = connectDB;
