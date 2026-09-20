const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema(
  {
    theme:       { type: String, required: true },
    shell:       { type: String, required: true },
    dashboard:   { type: String, required: true },
    surface:     { type: String, required: true },
    defaultMode: { type: String, required: true },
  },
  { _id: false }
);

const brandPackageSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true, maxlength: 40 },
    emoji:     { type: String, default: '✨', maxlength: 4 },
    tagline:   { type: String, default: '', trim: true, maxlength: 80 },
    memberApp: { type: appSettingsSchema, required: true },
    adminApp:  { type: appSettingsSchema, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('BrandPackage', brandPackageSchema);
