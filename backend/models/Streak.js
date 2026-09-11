const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCheckin: { type: Date, default: null },
    lastRestDayUsed: { type: Date, default: null },
    restDaysUsed: { type: Number, default: 0 },
    totalCheckins: { type: Number, default: 0 },
    badges: [{ type: String }], // e.g. "7-day-streak", "30-day-streak"
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Streak', streakSchema);
