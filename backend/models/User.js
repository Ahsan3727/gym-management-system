const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, lowercase: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'trainer', 'admin', 'super_admin'],
      required: true,
    },
    // Scopes this user account to their gym tenant.
    // null for super_admin and gym owners (admins), populated for customers and trainers.
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Compound unique index: username is unique PER GYM.
// Allows two different gyms to each have a customer or trainer named "ahsan" without collision.
userSchema.index({ admin: 1, username: 1 }, { unique: true });

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
};

// Never leak the hash if a user doc is ever serialized directly.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
