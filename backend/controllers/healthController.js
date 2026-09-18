const mongoose = require('mongoose');
const connectDB = require('../config/db');

const getHealth = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {}
  }

  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const isDatabaseConnected = dbState === 1;

  res.status(isDatabaseConnected ? 200 : 503).json({
    status: isDatabaseConnected ? 'healthy' : 'degraded',
    server: 'running',
    database: isDatabaseConnected ? 'connected' : (dbStatusMap[dbState] || 'disconnected'),
    readyState: dbState,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealth,
};
