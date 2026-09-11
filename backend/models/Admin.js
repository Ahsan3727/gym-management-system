const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    gymName: { type: String, required: true, trim: true },
    // Per-gym install identity (Option A branded PWA). Generated once at
    // creation time in superAdminRoutes.js and treated as immutable after
    // that — it becomes part of a public install URL (/g/<slug>) and any
    // installed home-screen shortcuts point at it via manifest start_url,
    // so changing it later would break those shortcuts.
    //
    // NOTE: intentionally NOT `required: true` at the schema level. Existing
    // Admin docs won't have a slug until the backfill migration
    // (scripts/backfill-slugs.js) runs, and `sparse: true` is what makes
    // that safe — a sparse unique index only enforces uniqueness among
    // documents that actually HAVE the field, so multiple pre-migration
    // docs missing `slug` won't collide with each other or fail index
    // creation. Every code path that creates an Admin (superAdminRoutes.js)
    // always sets one, so in practice it's required from the application's
    // point of view.
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
    // Accent color used for this gym's manifest theme_color/background and
    // (optionally) in-dashboard branding. Defaults to the platform's own
    // brand red so gyms that never touch this still get a sensible value.
    themeColor: { type: String, default: '#e11d48' },
    gymLogoUrl: { type: String, default: '' },
    address: { type: String, default: '' },
    contact: { type: String, default: '' },
    workingHours: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // the super_admin who created this gym
    isSuspended: { type: Boolean, default: false },
    checkinToken: { type: String, default: '' },
    checkinTokenExpiry: { type: Date, default: null },
    checkinTokenRequired: { type: Boolean, default: false },
    customMonthlyFee: { type: Number, default: null, min: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Admin', adminSchema);
