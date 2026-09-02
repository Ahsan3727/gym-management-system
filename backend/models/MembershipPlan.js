const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    planName: { type: String, required: true, trim: true }, // e.g. "Premium"
    price: { type: Number, required: true, min: 0 },
    durationMonths: { type: Number, required: true, min: 1 }, // 1, 3, 12 ...
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
