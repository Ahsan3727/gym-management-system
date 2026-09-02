const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    weightKg: { type: Number, required: true },
    heightCm: { type: Number, default: null }, // optional, lets us compute BMI
    measurements: {
      chestCm: { type: Number, default: null },
      waistCm: { type: Number, default: null },
      hipsCm: { type: Number, default: null },
      armsCm: { type: Number, default: null },
    },
    progressPhotoUrl: { type: String, default: '' },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

weightLogSchema.index({ customer: 1, date: -1 });

module.exports = mongoose.model('WeightLog', weightLogSchema);
