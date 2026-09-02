const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['paid', 'unpaid', 'overdue'], default: 'unpaid' },
    paidOn: { type: Date, default: null },
    isRecurring: { type: Boolean, default: false },
    receiptNumber: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

feeSchema.index({ admin: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Fee', feeSchema);
