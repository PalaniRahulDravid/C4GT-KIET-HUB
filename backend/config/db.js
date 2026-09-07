const mongoose = require('mongoose');
const config = require('./env');

let isConnecting = false;

const connectDB = async () => {
  if (!config.mongoUri) {
    console.error('Database connection aborted: MONGODB_URI is undefined.');
    return;
  }

  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`MongoDB Atlas connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    isConnecting = false;
    console.warn(`MongoDB Atlas connection waiting for IP Access List: ${error.message}`);
    // Auto-retry connecting every 5 seconds so when user adds IP in Atlas, it connects immediately
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
