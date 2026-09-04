const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

/**
 * Signs a short-lived access JWT with user id and role.
 * Defaults to 15m for security.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

/**
 * Generates a cryptographically secure refresh token, stores it in DB with 30-day expiry.
 */
async function generateRefreshToken(user) {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await RefreshToken.create({
    user: user._id,
    token,
    expiresAt,
  });

  return token;
}

generateToken.generateToken = generateToken;
generateToken.generateRefreshToken = generateRefreshToken;

module.exports = generateToken;
