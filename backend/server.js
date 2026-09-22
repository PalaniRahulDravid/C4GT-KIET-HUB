const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const connectDB = require('./config/db');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const cookieParser = require('cookie-parser');
require('./config/cloudinary');

const app = express();

connectDB().catch((err) => {
  console.warn('Initial DB connection warning:', err.message);
});

const allowedOrigins = [
  'https://c4gt-team6.vercel.app',
  'https://c4-gt-kiet-hub.vercel.app',
  'https://c4gt-kiet-hub.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://localhunt-khubteam2.vercel.app',
];

if (config.frontendUrl && !allowedOrigins.includes(config.frontendUrl)) {
  allowedOrigins.push(config.frontendUrl);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed) {
      return callback(null, true);
    }

    // Fallback: allow origin for deployed frontend domains to prevent CORS blocks
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Ensure DB connection before handling requests
app.use(async (req, res, next) => {
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error(`Database connection unavailable for ${req.method} ${req.path}:`, err.message);
    return res.status(503).json({
      success: false,
      message: 'Database service is temporarily unavailable. Please check MongoDB Atlas connection.',
    });
  }
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const PORT = config.port;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use by another process.`);
    } else {
      console.error('Server error:', err);
    }
  });

  const gracefulShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGUSR2', gracefulShutdown);
}

module.exports = app;
