const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    managerName: {
      type: String,
      default: '',
    },
    operatingHours: {
      type: String,
      default: '6:00 AM - 10:00 PM',
    },
    capacity: {
      type: Number,
      default: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

branchSchema.index({ admin: 1, name: 1 });

module.exports = mongoose.model('Branch', branchSchema);
