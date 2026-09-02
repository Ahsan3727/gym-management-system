// Creates the platform's first Super Admin account. Run once after the
// database is up: `npm run seed` (from the backend folder).
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

async function seed() {
  await connectDB();

  const username = (process.env.SUPER_ADMIN_USERNAME || 'superadmin').toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!';

  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`[seed] a user named "${username}" already exists - nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await User.hashPassword(password);
  await User.create({ username, passwordHash, role: 'super_admin' });

  console.log(`[seed] Super Admin created.`);
  console.log(`[seed]   username: ${username}`);
  console.log(`[seed]   password: ${password}`);
  console.log(`[seed] Log in once and change this password.`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
