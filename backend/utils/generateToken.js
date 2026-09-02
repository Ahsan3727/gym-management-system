const jwt = require('jsonwebtoken');

/**
 * Signs a JWT with the user's id and role embedded. The role travels inside
 * the token itself, while the `protect` middleware in middleware/auth.js
 * re-checks against the live user record for status (e.g. isActive).
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = generateToken;
