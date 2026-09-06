const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    checkedInAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    method: {
      type: String,
      enum: ['qr', 'manual', 'pin'],
      default: 'qr',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

attendanceSchema.index({ admin: 1, checkedInAt: -1 });
attendanceSchema.index({ customer: 1, checkedInAt: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
