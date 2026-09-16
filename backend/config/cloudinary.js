const cloudinary = require('cloudinary').v2;
const config = require('./env');

const isCloudinaryConfigured = Boolean(
  config.cloudinary.cloudName &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
} else {
  console.warn('Notice: Cloudinary credentials not fully set in .env. File uploads will require valid Cloudinary keys.');
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
};
