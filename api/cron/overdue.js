require('dotenv').config({ path: require('path').resolve(__dirname, '../../backend/.env') });
require('dotenv').config();

const connectDB = require('../../backend/config/db');
const markOverdueFees = require('../../backend/jobs/markOverdueFees');

module.exports = async (req, res) => {
  // Protect cron endpoint with CRON_SECRET if configured in environment
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.authorization;
    const xSecret = req.headers['x-cron-secret'];
    const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (bearerSecret !== secret && xSecret !== secret) {
      return res.status(401).json({ message: 'Unauthorized cron trigger.' });
    }
  }

  try {
    await connectDB();
    const result = await markOverdueFees();
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (err) {
    console.error('[cron/overdue] Error executing overdue fee job:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
