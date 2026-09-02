require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
require('dotenv').config();

const app = require('../backend/app');
const connectDB = require('../backend/config/db');

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
