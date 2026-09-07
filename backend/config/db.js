const mongoose = require('mongoose');
const dns = require('dns');
const config = require('./env');

let isConnecting = false;

// Configure reliable DNS servers (Google & Cloudflare) to prevent querySrv ECONNREFUSED on ISPs/networks that block or fail SRV queries
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);
} catch (err) {
  console.warn('Failed to set custom DNS servers:', err.message);
}

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
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Atlas connected successfully: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    isConnecting = false;
    console.warn(`MongoDB Atlas connection waiting/retrying: ${error.message}`);
    // Auto-retry connecting every 5 seconds so when network/IP access is ready, it connects immediately
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;