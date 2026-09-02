const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    exercise: { type: String, required: true, trim: true },
    sets: { type: Number, default: null },
    reps: { type: Number, default: null },
    weight: { type: Number, default: null }, // in kg
    durationMinutes: { type: Number, default: null },
    isRestDay: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

workoutLogSchema.index({ customer: 1, date: -1 });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
