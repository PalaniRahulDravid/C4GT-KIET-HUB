const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || '',
};

if (!config.mongoUri) {
  // Warn if database connection string is not provided in environment
  console.warn('Warning: MONGODB_URI is not set in environment configuration.');
}

module.exports = config;
