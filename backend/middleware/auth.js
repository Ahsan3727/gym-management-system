const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verifies the JWT and attaches the live user document to req.user.
 * Re-reading the user (rather than trusting the token alone) means a
 * disabled/suspended account is rejected immediately, not just after
 * the token expires.
 */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated. No token provided.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  const user = await User.findById(payload.id);
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Account not found or disabled.' });
  }

  req.user = user; // full mongoose doc, role is source of truth from DB
  next();
});

/**
 * Restricts a route to one or more roles. Always used AFTER protect().
 * Usage: authorize('admin', 'super_admin')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do that.' });
    }
    next();
  };
}

module.exports = { protect, authorize };
