const mongoose = require('mongoose');

// Cached across invocations. On a traditional server this cache is only
// ever populated once. On Vercel, each serverless function instance can be
// reused ("warm") between requests, and this cache stops a warm instance
// from opening a brand new MongoDB connection on every single request.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and configure it.');
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(uri).then((m) => {
      console.log(`[db] connected to MongoDB at ${uri.replace(/\/\/.*@/, '//***@')}`);
      return m;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
