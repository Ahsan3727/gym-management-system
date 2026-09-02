const express = require('express');
const crypto = require('crypto');

const User = require('../models/User');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Fee = require('../models/Fee');
const AuditLog = require('../models/AuditLog');
const Settings = require('../models/Settings');

const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('super_admin'));

function logAction(req, action, targetType, targetId, metadata = {}) {
  return AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.role,
    action,
    targetType,
    targetId,
    metadata,
  });
}

/* ------------------------------ Admin accounts ------------------------------ */

router.get(
  '/admins',
  asyncHandler(async (req, res) => {
    const admins = await Admin.find().populate('user', 'username isActive created_at').sort({ created_at: -1 });
    res.json(admins);
  })
);

// Creates a User (role=admin) + linked Admin/gym doc.
router.post(
  '/admins',
  asyncHandler(async (req, res) => {
    const { username, password, gymName, address, contact, workingHours } = req.body;
    if (!username || !password || !gymName) {
      return res.status(400).json({ message: 'username, password and gymName are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'That username is already taken.' });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ username: username.trim().toLowerCase(), passwordHash, role: 'admin' });
    const admin = await Admin.create({
      user: user._id,
      gymName,
      address,
      contact,
      workingHours,
      createdBy: req.user._id,
    });

    await logAction(req, 'admin.create', 'Admin', admin._id, { gymName });
    res.status(201).json(admin);
  })
);

router.put(
  '/admins/:id',
  asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    const { gymName, address, contact, workingHours } = req.body;
    if (gymName !== undefined) admin.gymName = gymName;
    if (address !== undefined) admin.address = address;
    if (contact !== undefined) admin.contact = contact;
    if (workingHours !== undefined) admin.workingHours = workingHours;
    await admin.save();
    await logAction(req, 'admin.update', 'Admin', admin._id);
    res.json(admin);
  })
);

router.put(
  '/admins/:id/suspend',
  asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    admin.isSuspended = req.body.suspend !== false;
    await admin.save();
    await logAction(req, admin.isSuspended ? 'admin.suspend' : 'admin.unsuspend', 'Admin', admin._id);
    res.json(admin);
  })
);

router.put(
  '/admins/:id/disable',
  asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    const isActive = req.body.enable === true;
    await User.findByIdAndUpdate(admin.user, { isActive });
    await logAction(req, isActive ? 'admin.enable_login' : 'admin.disable_login', 'Admin', admin._id);
    res.json({ message: 'Admin login access updated.' });
  })
);

// BUG #2 FIX: The temp password is no longer returned in the HTTP response body.
// In a production system this MUST be delivered via email (add a mailer service).
// For now it is logged server-side ONLY so it never appears in browser network
// history, response bodies, or frontend UI.
router.put(
  '/admins/:id/reset-password',
  asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    const tempPassword = crypto.randomBytes(6).toString('base64url');
    const passwordHash = await User.hashPassword(tempPassword);
    await User.findByIdAndUpdate(admin.user, { passwordHash });

    await logAction(req, 'admin.reset_password', 'Admin', admin._id);

    // TODO: Send tempPassword via email to the gym owner instead of logging here.
    // This is a placeholder — integrate a mailer (e.g. Nodemailer + SendGrid).
    console.log(`[reset-password] Temp password for gym "${admin.gymName}": ${tempPassword}`);

    res.json({
      message: `Password has been reset for ${admin.gymName}. The temporary password has been logged to the server console. Please configure a mailer to email it to the gym owner directly.`,
    });
  })
);

/* --------------------------------- Oversight --------------------------------- */

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [gymCount, customerCount, revenueRows] = await Promise.all([
      Admin.countDocuments(),
      Customer.countDocuments(),
      Fee.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);
    res.json({
      totalGyms: gymCount,
      totalCustomers: customerCount,
      totalRevenueCollected: revenueRows[0]?.total || 0,
    });
  })
);

router.get(
  '/admins/:id/summary',
  asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    const [customerCount, revenueRows, overdueCount] = await Promise.all([
      Customer.countDocuments({ admin: admin._id }),
      Fee.aggregate([
        { $match: { admin: admin._id, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Fee.countDocuments({ admin: admin._id, status: 'overdue' }),
    ]);

    res.json({
      gymName: admin.gymName,
      customerCount,
      revenueCollected: revenueRows[0]?.total || 0,
      overdueFees: overdueCount,
    });
  })
);

router.get(
  '/audit-log',
  asyncHandler(async (req, res) => {
    const logs = await AuditLog.find().populate('actor', 'username role').sort({ created_at: -1 }).limit(200);
    res.json(logs);
  })
);

/* ------------------------------ Platform settings ----------------------------- */

router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    res.json(await Settings.getSingleton());
  })
);

router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const settings = await Settings.getSingleton();
    const { currency, termsUrl, platformBillingEnabled, platformBillingNote } = req.body;
    if (currency !== undefined) settings.currency = currency;
    if (termsUrl !== undefined) settings.termsUrl = termsUrl;
    if (platformBillingEnabled !== undefined) settings.platformBillingEnabled = platformBillingEnabled;
    if (platformBillingNote !== undefined) settings.platformBillingNote = platformBillingNote;
    await settings.save();
    await logAction(req, 'settings.update', 'Settings', settings._id);
    res.json(settings);
  })
);

module.exports = router;
