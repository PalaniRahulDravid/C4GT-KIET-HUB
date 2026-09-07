const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const connectDB = require('./config/db');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const cookieParser = require('cookie-parser');

const app = express();

connectDB();

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://localhunt-khubteam2.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());


app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const PORT = config.port;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
