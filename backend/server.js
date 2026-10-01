// Server entrypoint (local development and Hyperlift). Starts the Express app
// on PORT and runs the daily overdue-fees job with node-cron.
// (On Vercel, api/index.js is used instead and this file is not called.)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const cron = require('node-cron');

const { validateEnv } = require('./utils/env');
validateEnv();

const app = require('./app');
const connectDB = require('./config/db');
const markOverdueFees = require('./jobs/markOverdueFees');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));

    // Daily overdue-fees job: 00:00 UTC (5:00 AM Pakistan time).
    // Replaces the Vercel cron. Keep Hyperlift on 1 instance so it runs once.
    cron.schedule(
      '0 0 * * *',
      () => markOverdueFees().catch((e) => console.error('[cron] overdue job failed', e)),
      { timezone: 'UTC' }
    );
  })
  .catch((err) => {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  });
