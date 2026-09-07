const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'c4gt_kiet_hub_jwt_secret_dev_key_2026',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
};

if (!config.mongoUri) {
  // Warn if database connection string is not provided in environment
  console.warn('Warning: MONGODB_URI / DATABASE_URL is not set in environment configuration.');
}

module.exports = config;


