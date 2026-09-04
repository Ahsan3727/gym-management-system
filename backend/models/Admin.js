const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    gymName: { type: String, required: true, trim: true },
    gymLogoUrl: { type: String, default: '' },
    address: { type: String, default: '' },
    contact: { type: String, default: '' },
    workingHours: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // the super_admin who created this gym
    isSuspended: { type: Boolean, default: false },
    checkinToken: { type: String, default: '' },
    checkinTokenExpiry: { type: Date, default: null },
    checkinTokenRequired: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Admin', adminSchema);
