const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['fee_due', 'streak_reminder', 'admin_alert', 'general'],
      default: 'general',
    },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);
// Compound index for the unread-first query pattern (user + readAt)
notificationSchema.index({ user: 1, readAt: 1, sentAt: -1 });
// TTL: auto-delete notifications older than 90 days to keep the collection lean
notificationSchema.index({ sentAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
