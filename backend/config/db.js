const mongoose = require('mongoose');

// Cached across invocations. On a traditional server this cache is only
// ever populated once. On Vercel, each serverless function instance can be
// reused ("warm") between requests, and this cache stops a warm instance
// from opening a brand new MongoDB connection on every single request.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

// Hosting dashboards sometimes keep invisible leftovers when a value is pasted:
// spaces, a line break, wrapping quotes, or a "MONGO_URI=" prefix. Any of these
// makes MongoDB answer "bad auth". Remove them without touching the real link.
function cleanUri(raw) {
  let uri = String(raw).trim();
  uri = uri.replace(/^MONGO_URI\s*=\s*/i, '').trim();
  uri = uri.replace(/^(["'`])([\s\S]*)\1$/, '$2').trim();
  return uri;
}

// Safe description of the connection string for the logs.
// It never prints the password, only its length and obvious problems with it.
function describeUri(raw, used) {
  const info = {
    valueChangedByCleaning: raw !== used,
    startsWith: used.slice(0, 14),
  };
  const m = used.match(/^(mongodb(?:\+srv)?):\/\/([^:@\/]+):(.*)@([^@\/?]+)(\/[^?]*)?(\?.*)?$/);
  if (!m) {
    info.format = 'NOT RECOGNISED (expected mongodb+srv://user:password@host/database?options)';
    return info;
  }
  const pass = m[3];
  info.protocol = m[1];
  info.username = m[2];
  info.passwordLength = pass.length;
  info.passwordLooksLikePlaceholder = /^<.*>$/.test(pass) || /db_password|your.?password/i.test(pass);
  info.passwordHasUnencodedSpecialChars = /[@:\/?#\[\]\s]/.test(pass);
  info.host = m[4];
  info.database = (m[5] || '/').slice(1) || '(none given, MongoDB uses "test")';
  info.options = m[6] || '(none)';
  return info;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  const raw = process.env.MONGO_URI;
  if (!raw) {
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and configure it.');
  }
  const uri = cleanUri(raw);

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose
      .connect(uri)
      .then((m) => {
        console.log(`[db] connected to MongoDB at ${uri.replace(/\/\/.*@/, '//***@')}`);
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('[db] connection failed:', err.message);
        console.error('[db] diagnostic:', JSON.stringify(describeUri(String(raw), uri)));
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
