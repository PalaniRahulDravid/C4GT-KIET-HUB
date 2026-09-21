const mongoose = require('mongoose');
const config = require('./env');

if (process.env.NODE_ENV !== 'production') {
  try {
    const dns = require('dns');
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);
  } catch (err) { }
}

// Serverless connection cache
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Strip credentials for safe logging
const sanitizeMongoUri = (uri) => {
  if (!uri) return 'undefined';
  try {
    const withoutAuth = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    return withoutAuth.split('?')[0];
  } catch {
    return '[Protected URI]';
  }
};

const connectDB = async () => {
  if (!config.mongoUri) {
    console.error(
      'Database connection aborted: MONGODB_URI (or MONGO_URI / DATABASE_URL) is not defined in environment variables.'
    );
    return null;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000,
    };

    console.log(`Initiating MongoDB Atlas connection to: ${sanitizeMongoUri(config.mongoUri)}`);

    cached.promise = mongoose
      .connect(config.mongoUri, opts)
      .then(async (mongooseInstance) => {
        console.log(`MongoDB Atlas connected successfully to host: ${mongooseInstance.connection.host}`);
        try {
          const teamsColl = mongooseInstance.connection.db.collection('teams');
          const teamIndexes = await teamsColl.indexes();
          if (teamIndexes.some((idx) => idx.name === 'name_1')) {
            await teamsColl.dropIndex('name_1');
          }
          if (teamIndexes.some((idx) => idx.name === 'teamNumber_1')) {
            await teamsColl.dropIndex('teamNumber_1');
          }
        } catch (idxErr) {
          // non-blocking
        }
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('MongoDB Atlas connection failed:', {
          name: err.name,
          message: err.message,
          code: err.code,
        });
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;