const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // admin is the tenant-scoping key. Every query that touches customer-owned
    // data must filter by this field, enforced server-side (see middleware/tenant.js).
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    joinDate: { type: Date, default: Date.now },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', default: null },
    goals: { type: String, default: '' },
    notificationPrefs: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

customerSchema.index({ admin: 1, name: 1 });

module.exports = mongoose.model('Customer', customerSchema);
