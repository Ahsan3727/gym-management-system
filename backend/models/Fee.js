const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    invoiceNumber: { type: String, uppercase: true, trim: true, sparse: true },
    title: { type: String, default: 'Monthly Subscription', trim: true },
    feeType: {
      type: String,
      enum: ['subscription', 'admission', 'personal_training', 'locker', 'custom'],
      default: 'subscription',
    },
    billingMonth: { type: String, default: '', trim: true },
    amount: { type: Number, required: true, min: 0 },
    admissionFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'overdue', 'waived'],
      default: 'unpaid',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'jazzcash', 'easypaisa', 'bank_transfer', 'card', 'other', null],
      default: null,
    },
    paidOn: { type: Date, default: null },
    isRecurring: { type: Boolean, default: false },
    receiptNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

feeSchema.index({ admin: 1, status: 1, dueDate: 1 });
feeSchema.index({ admin: 1, customer: 1, created_at: -1 });

// Generate sequential receipt/invoice number per gym: REC-YYYYMM-XXXX
feeSchema.statics.generateReceiptNumber = async function (adminId) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `REC-${yearMonth}-`;

  const count = await this.countDocuments({
    admin: adminId,
    receiptNumber: { $regex: `^${prefix}` },
  });

  const seq = String(count + 1).padStart(4, '0');
  const candidate = `${prefix}${seq}`;

  const exists = await this.findOne({ admin: adminId, receiptNumber: candidate });
  if (!exists) return candidate;

  const rand = Math.floor(10 + Math.random() * 90);
  return `${prefix}${seq}-${rand}`;
};

module.exports = mongoose.model('Fee', feeSchema);
