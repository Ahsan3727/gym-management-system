// Vercel serverless entrypoint. Vercel builds every file in /api into its
// own function; this one catches all backend routes (see ../vercel.json,
// which rewrites every request to this file while preserving the original
// path, so Express's own /api/... routing still works unchanged).
require('dotenv').config();

const app = require('../app');
const connectDB = require('../config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[api] database connection failed:', err.message);
    res.status(500).json({ message: 'Database connection failed.' });
    return;
  }
  return app(req, res);
};
