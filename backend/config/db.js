const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  if (!config.mongoUri) {
    console.error('Database connection aborted: MONGODB_URI is undefined.');
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
  }
};

module.exports = connectDB;
