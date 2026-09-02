const mongoose = require('mongoose');

const dietLogSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    meal: { type: String, required: true, trim: true }, // e.g. "Breakfast", "Chicken & rice"
    calories: { type: Number, default: null },
    macros: {
      proteinG: { type: Number, default: null },
      carbsG: { type: Number, default: null },
      fatG: { type: Number, default: null },
    },
    waterMl: { type: Number, default: 0 }, // running water intake logged for the day
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

dietLogSchema.index({ customer: 1, date: -1 });

module.exports = mongoose.model('DietLog', dietLogSchema);
