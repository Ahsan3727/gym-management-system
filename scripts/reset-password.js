require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const connectDB = require('../backend/config/db');
const User = require('../backend/models/User');

async function resetPassword() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    console.log('Usage: node scripts/reset-password.js <username> <newPassword>');
    process.exit(1);
  }

  await connectDB();
  const user = await User.findOne({ username: username.trim().toLowerCase() });
  if (!user) {
    console.error(`Error: User "${username}" not found.`);
    process.exit(1);
  }

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();

  console.log(`Successfully updated password for "${user.username}" (role: ${user.role}).`);
  process.exit(0);
}

resetPassword().catch((err) => {
  console.error('Password reset failed:', err);
  process.exit(1);
});
