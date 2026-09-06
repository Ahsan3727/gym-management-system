const mongoose = require('mongoose');

// Singleton document (there is only ever one). Super Admin edits this.
const settingsSchema = new mongoose.Schema(
  {
    currency: { type: String, default: 'PKR' },
    termsUrl: { type: String, default: '' },
    platformBillingEnabled: { type: Boolean, default: false },
    platformBillingNote: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

settingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({ currency: 'PKR' });
  } else if (doc.currency === 'USD') {
    doc.currency = 'PKR';
    await doc.save();
  }
  return doc;
};

module.exports = mongoose.model('Settings', settingsSchema);
