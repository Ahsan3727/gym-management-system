const express = require('express');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Trainer = require('../models/Trainer');
const RefreshToken = require('../models/RefreshToken');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');

const router = express.Router();

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
};

/**
 * POST /api/auth/login
 * The one login screen every account uses. The backend reads the role off
 * the user record and the frontend redirects to the matching dashboard.
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password, gymSlug } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    let gym = null;

    if (gymSlug) {
      gym = await Admin.findOne({ slug: gymSlug.trim().toLowerCase() });
      if (!gym) {
        return res.status(404).json({ message: 'Gym not found for this install link.' });
      }
      if (gym.isSuspended) {
        return res.status(403).json({ message: 'This gym account has been suspended.' });
      }
    }

    let user;
    if (gym) {
      // Scoped lookup for this specific gym
      user = await User.findOne({ username: cleanUsername, admin: gym._id });
    } else {
      // Fallback for staff/superadmin login or unspecified gym
      const candidates = await User.find({ username: cleanUsername });
      if (candidates.length === 1) {
        user = candidates[0];
      } else if (candidates.length > 1) {
        // Disambiguate by checking password match among candidates
        for (const candidate of candidates) {
          if (await candidate.comparePassword(password)) {
            user = candidate;
            break;
          }
        }
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Check if the gym is suspended (for admin, customer, or trainer)
    if (user.role === 'admin') {
      const adminDoc = await Admin.findOne({ user: user._id });
      if (adminDoc?.isSuspended) {
        return res.status(403).json({ message: 'This gym account has been suspended.' });
      }
    } else if (user.admin) {
      const adminDoc = await Admin.findById(user.admin);
      if (adminDoc?.isSuspended) {
        return res.status(403).json({ message: 'This gym account has been suspended.' });
      }
    }

    const token = generateToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      token,
      refreshToken, // Also return for non-cookie mobile/testing clients
      user: { id: user._id, username: user.username, role: user.role, admin: user.admin },
    });
  })
);

/**
 * POST /api/auth/refresh
 * Exchanges a valid refresh token for a new access token (and rotates refresh token).
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const tokenStr = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!tokenStr) {
      return res.status(401).json({ message: 'Refresh token required.' });
    }

    const stored = await RefreshToken.findOne({ token: tokenStr }).populate('user');
    if (!stored || !stored.user || !stored.user.isActive || stored.expiresAt < new Date()) {
      if (stored) {
        await RefreshToken.deleteOne({ _id: stored._id });
      }
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({ message: 'Invalid or expired refresh token. Please log in again.' });
    }

    // If gym admin is suspended, invalidate session immediately
    if (stored.user.role === 'admin') {
      const adminDoc = await Admin.findOne({ user: stored.user._id });
      if (adminDoc?.isSuspended) {
        await RefreshToken.deleteOne({ _id: stored._id });
        res.clearCookie('refreshToken', { path: '/' });
        return res.status(403).json({ message: 'This gym account has been suspended.' });
      }
    }

    // Token rotation: delete old token, generate new tokens
    await RefreshToken.deleteOne({ _id: stored._id });

    const newAccessToken = generateToken(stored.user);
    const newRefreshToken = await generateRefreshToken(stored.user);

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: { id: stored.user._id, username: stored.user.username, role: stored.user.role },
    });
  })
);

/**
 * POST /api/auth/logout
 * Server-side logout invalidation: removes refresh token from DB and clears cookie.
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const tokenStr = req.cookies?.refreshToken || req.body?.refreshToken;
    if (tokenStr) {
      await RefreshToken.deleteOne({ token: tokenStr });
    }
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Logged out successfully.' });
  })
);

/**
 * GET /api/auth/me
 * Returns the current user plus role-specific profile info, so the
 * frontend can render the right dashboard immediately after login/refresh.
 */
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const base = { id: req.user._id, username: req.user.username, role: req.user.role };

    if (req.user.role === 'admin') {
      const adminDoc = await Admin.findOne({ user: req.user._id });
      return res.json({ ...base, profile: adminDoc });
    }
    if (req.user.role === 'customer') {
      const customerDoc = await Customer.findOne({ user: req.user._id }).populate('plan');
      return res.json({ ...base, profile: customerDoc });
    }
    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id }).populate('assignedCustomers', 'name phone');
      return res.json({ ...base, profile: trainerDoc });
    }
    res.json(base); // super_admin has no extra profile document
  })
);

/**
 * PUT /api/auth/change-password
 * Any logged-in user can change their own password.
 */
router.put(
  '/change-password',
  protect,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }
    const match = await req.user.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }
    req.user.passwordHash = await User.hashPassword(newPassword);
    await req.user.save();

    // Revoke all existing refresh tokens for security
    await RefreshToken.deleteMany({ user: req.user._id });

    res.json({ message: 'Password updated. Existing sessions have been invalidated.' });
  })
);

module.exports = router;
