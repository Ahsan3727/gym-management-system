// One-off migration: backfills `slug` for every existing Admin doc that
// doesn't have one yet, derived from its current gymName. Safe to run
// multiple times — admins that already have a slug are skipped.
//
// Run this ONCE against your database right after deploying the Phase 1
// schema change (backend/models/Admin.js) and before announcing per-gym
// install links to gym owners (see IMPLEMENTATION_PLAN.md Phase 9).
//
// Usage: node scripts/backfill-slugs.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const connectDB = require('../backend/config/db');
const Admin = require('../backend/models/Admin');
const { generateUniqueSlug } = require('../backend/utils/slugify');

async function backfillSlugs() {
  await connectDB();

  const admins = await Admin.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
  });

  console.log(`Found ${admins.length} admin doc(s) without a slug.`);

  for (const admin of admins) {
    // Sequential on purpose: generateUniqueSlug checks the DB for the
    // current state, so awaiting one at a time keeps two gyms with the
    // same name from racing each other into the same slug.
    // eslint-disable-next-line no-await-in-loop
    const slug = await generateUniqueSlug(admin.gymName);
    admin.slug = slug;
    // eslint-disable-next-line no-await-in-loop
    await admin.save();
    console.log(`  -> "${admin.gymName}" (${admin._id}) => slug "${slug}"`);
  }

  console.log('Slug backfill complete.');
  process.exit(0);
}

backfillSlugs().catch((err) => {
  console.error('Slug backfill failed:', err);
  process.exit(1);
});
