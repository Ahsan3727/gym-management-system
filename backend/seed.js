// Creates the platform's first Super Admin account. Run once after the
// database is up: `npm run seed` (from the backend folder).
// Pass `--demo` to also seed sample data for Admin, Trainer, and Customer:
// `node seed.js --demo` or `npm run seed:demo`
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Admin = require('./models/Admin');
const Trainer = require('./models/Trainer');
const Customer = require('./models/Customer');

async function seed() {
  await connectDB();

  const username = (process.env.SUPER_ADMIN_USERNAME || 'superadmin').toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!';

  let superAdminUser = await User.findOne({ username });
  if (superAdminUser) {
    console.log(`[seed] a user named "${username}" already exists.`);
  } else {
    const passwordHash = await User.hashPassword(password);
    superAdminUser = await User.create({ username, passwordHash, role: 'super_admin' });
    console.log(`[seed] Super Admin created:`);
    console.log(`[seed]   username: ${username}`);
    console.log(`[seed]   password: ${password}`);
  }

  // Optional Demo Data
  if (process.argv.includes('--demo')) {
    console.log('\n[seed] --- Seeding Demo Environment (--demo) ---');

    // 1. Demo Gym Admin
    let adminUser = await User.findOne({ username: 'demoadmin' });
    let adminDoc;
    if (!adminUser) {
      const hash = await User.hashPassword('Demo1234!');
      adminUser = await User.create({
        username: 'demoadmin',
        email: 'admin@ironlinegym.test',
        passwordHash: hash,
        role: 'admin',
      });
      adminDoc = await Admin.create({
        user: adminUser._id,
        gymName: 'Ironline Performance Center',
        contact: '555-0199',
        address: '100 Iron Blvd, Downtown',
        workingHours: 'Mon-Sat 06:00 - 22:00',
        createdBy: superAdminUser._id,
      });
      console.log('[seed] Demo Admin created:');
      console.log('       username: demoadmin / Demo1234!');
      console.log('       gymName: Ironline Performance Center');
    } else {
      adminDoc = await Admin.findOne({ user: adminUser._id });
      console.log('[seed] Demo Admin demoadmin already exists.');
    }

    // 2. Demo Trainer
    let trainerUser = await User.findOne({ username: 'demotrainer' });
    let trainerDoc;
    if (!trainerUser && adminDoc) {
      const hash = await User.hashPassword('Demo1234!');
      trainerUser = await User.create({
        username: 'demotrainer',
        email: 'trainer@ironlinegym.test',
        passwordHash: hash,
        role: 'trainer',
      });
      trainerDoc = await Trainer.create({
        user: trainerUser._id,
        admin: adminDoc._id,
        name: 'Marcus Vance',
        phone: '555-0144',
        specialty: 'Strength & Conditioning',
        bio: 'Certified strength specialist with 8 years of competitive coaching experience.',
      });
      console.log('[seed] Demo Trainer created:');
      console.log('       username: demotrainer / Demo1234!');
    } else if (trainerUser && adminDoc) {
      trainerDoc = await Trainer.findOne({ user: trainerUser._id });
      console.log('[seed] Demo Trainer demotrainer already exists.');
    }

    // 3. Demo Customer
    let customerUser = await User.findOne({ username: 'demomember' });
    if (!customerUser && adminDoc) {
      const hash = await User.hashPassword('Demo1234!');
      customerUser = await User.create({
        username: 'demomember',
        email: 'member@ironlinegym.test',
        passwordHash: hash,
        role: 'customer',
      });
      const custDoc = await Customer.create({
        user: customerUser._id,
        admin: adminDoc._id,
        name: 'Alex Rivera',
        phone: '555-0123',
        goals: 'Hypertrophy and mobility',
      });
      if (trainerDoc) {
        await Trainer.findByIdAndUpdate(trainerDoc._id, {
          $addToSet: { assignedCustomers: custDoc._id },
        });
      }
      console.log('[seed] Demo Customer created:');
      console.log('       username: demomember / Demo1234!');
    } else {
      console.log('[seed] Demo Customer demomember already exists.');
    }

    console.log('[seed] Demo seeding complete. All 4 roles ready for local testing!\n');
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
