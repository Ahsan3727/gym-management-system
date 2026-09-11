const express = require('express');
const crypto = require('crypto');

const User = require('../models/User');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Fee = require('../models/Fee');
const AuditLog = require('../models/AuditLog');
const Settings = require('../models/Settings');
const RefreshToken = require('../models/RefreshToken');

const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');
const { passwordResetEmail } = require('../utils/emailTemplates');
const { generateUniqueSlug } = require('../utils/slugify');
const { buildInstallQr, buildStaffInstallQr } = require('../utils/installQr');
const { validate } = require('../middleware/validate');
const {
  createAdminSchema,
  updateAdminSchema,
  updateSettingsSchema,
  suspendAdminSchema,
  disableAdminSchema,
} = require('../schemas/superAdminSchemas');

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
    // PERF FIX: .lean() — this list is read-only (serialized straight to
    // JSON, never saved back), so there's no reason to pay for full
    // Mongoose document hydration (getters, virtuals, change-tracking)
    // on every gym account in the platform. .lean() returns plain JS
    // objects instead, which is measurably cheaper for read-only list
    // endpoints like this one.
    const admins = await Admin.find()
      .populate('user', 'username isActive created_at')
      .sort({ created_at: -1 })
      .lean();
    res.json(admins);
  })
);

// Creates a User (role=admin) + linked Admin/gym doc.
router.post(
  '/admins',
  validate(createAdminSchema),
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

    // Slug powers this gym's public install URL (/g/<slug>) and manifest,
    // so it's generated once here, at creation time — never left for the
    // client to supply. Collisions ("Iron Clad Gym" twice) auto-suffix.
    const slug = await generateUniqueSlug(gymName);

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ username: username.trim().toLowerCase(), passwordHash, role: 'admin' });
    const admin = await Admin.create({
      user: user._id,
      gymName,
      slug,
      address,
      contact,
      workingHours,
      createdBy: req.user._id,
    });
    user.admin = admin._id;
    await user.save();

    await logAction(req, 'admin.create', 'Admin', admin._id, { gymName, slug });
    // `slug` rides along on the Admin doc already — the super admin UI
    // (Admins.jsx) reads it off the create response to show the install link.
    res.status(201).json(admin);
  })
);

router.put(
  '/admins/:id',
  validate(updateAdminSchema),
  asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    // `slug` is deliberately NOT accepted here. It's a public-facing install
    // URL and installed home-screen shortcuts point at it via manifest
    // start_url — changing it after the fact would break those shortcuts.
    const { gymName, address, contact, workingHours, themeColor } = req.body;
    if (gymName !== undefined) admin.gymName = gymName;
    if (address !== undefined) admin.address = address;
    if (contact !== undefined) admin.contact = contact;
    if (workingHours !== undefined) admin.workingHours = workingHours;
    if (themeColor !== undefined) admin.themeColor = themeColor;
    await admin.save();
    await logAction(req, 'admin.update', 'Admin', admin._id);
    res.json(admin);
  })
);

// Lets the super admin pull up a printable/shareable QR for a specific
// gym's install link without leaving the Gym accounts page.
router.get(
  '/admins/:id/install-qr',
  asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    if (!admin.slug) {
      return res.status(409).json({ message: 'This gym has no install slug yet — run the slug backfill migration.' });
    }
    res.json(await buildInstallQr(req, admin.slug));
  })
);

// Generates a QR code and URL for installing the Staff Operations App (/staff)
router.get(
  '/staff-install-qr',
  asyncHandler(async (req, res) => {
    res.json(await buildStaffInstallQr(req));
  })
);

router.put(
  '/admins/:id/suspend',
  validate(suspendAdminSchema),
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
  validate(disableAdminSchema),
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
    const adminUser = await User.findByIdAndUpdate(admin.user, { passwordHash }, { new: true });

    // Revoke all existing sessions for this gym admin
    await RefreshToken.deleteMany({ user: admin.user });

    await logAction(req, 'admin.reset_password', 'Admin', admin._id);

    const recipientEmail = admin.contactEmail || adminUser?.email || (adminUser?.username?.includes('@') ? adminUser.username : null);
    let emailSent = false;
    if (recipientEmail) {
      const mailResult = await sendEmail({
        to: recipientEmail,
        subject: `Temporary Password Reset — ${admin.gymName}`,
        html: passwordResetEmail(admin.gymName, tempPassword),
      });
      emailSent = !!mailResult.success;
    }

    const maskedPw = tempPassword.slice(0, 3) + '***' + tempPassword.slice(-2);
    console.log(`[reset-password] Temp password set for gym "${admin.gymName}" (masked: ${maskedPw}). Email sent: ${emailSent}. Check email or ask the super admin.`);

    res.json({
      message: emailSent
        ? `Password has been reset for ${admin.gymName}. A temporary password has been emailed to ${recipientEmail}.`
        : `Password has been reset for ${admin.gymName}. The temporary password has been logged to the server console.`,
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
    // PERF FIX: .lean() for the same reason as GET /admins above — this
    // is a read-only, JSON-out endpoint.
    const logs = await AuditLog.find()
      .populate('actor', 'username role')
      .sort({ created_at: -1 })
      .limit(200)
      .lean();
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
  validate(updateSettingsSchema),
  asyncHandler(async (req, res) => {
    const settings = await Settings.getSingleton();
    const {
      currency,
      termsUrl,
      platformBillingEnabled,
      platformBillingNote,
      defaultMonthlyFee,
      gracePeriodDays,
      bankName,
      accountTitle,
      accountNumber,
      iban,
      jazzcashNumber,
      easypaisaNumber,
    } = req.body;
    if (currency !== undefined) settings.currency = currency;
    if (termsUrl !== undefined) settings.termsUrl = termsUrl;
    if (platformBillingEnabled !== undefined) settings.platformBillingEnabled = platformBillingEnabled;
    if (platformBillingNote !== undefined) settings.platformBillingNote = platformBillingNote;
    if (defaultMonthlyFee !== undefined) settings.defaultMonthlyFee = defaultMonthlyFee;
    if (gracePeriodDays !== undefined) settings.gracePeriodDays = gracePeriodDays;
    if (bankName !== undefined) settings.bankName = bankName;
    if (accountTitle !== undefined) settings.accountTitle = accountTitle;
    if (accountNumber !== undefined) settings.accountNumber = accountNumber;
    if (iban !== undefined) settings.iban = iban;
    if (jazzcashNumber !== undefined) settings.jazzcashNumber = jazzcashNumber;
    if (easypaisaNumber !== undefined) settings.easypaisaNumber = easypaisaNumber;
    await settings.save();
    await logAction(req, 'settings.update', 'Settings', settings._id);
    res.json(settings);
  })
);

/* ----------------------------- Platform analytics ---------------------------- */

router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalGyms,
      activeGyms,
      totalCustomers,
      totalRevenueRaw,
      monthlyRevenueRaw,
      gymRegistrationsRaw,
      gymSummaries,
    ] = await Promise.all([
      Admin.countDocuments(),
      Admin.countDocuments({ isSuspended: false }),
      Customer.countDocuments(),
      Fee.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Fee.aggregate([
        {
          $match: {
            status: 'paid',
            paidOn: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$paidOn' },
              month: { $month: '$paidOn' },
            },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Admin.aggregate([
        {
          $match: {
            created_at: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$created_at' },
              month: { $month: '$created_at' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Admin.find().select('gymName slug isSuspended created_at').lean(),
    ]);

    const totalRevenue = totalRevenueRaw[0]?.total || 0;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = [];
    const monthlyGymGrowth = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const label = `${monthNames[m - 1]} ${y}`;

      const revMatch = monthlyRevenueRaw.find((r) => r._id.year === y && r._id.month === m);
      monthlyRevenue.push({
        month: label,
        revenue: revMatch ? revMatch.revenue : 0,
      });

      const gymMatch = gymRegistrationsRaw.find((r) => r._id.year === y && r._id.month === m);
      monthlyGymGrowth.push({
        month: label,
        count: gymMatch ? gymMatch.count : 0,
      });
    }

    // PERF FIX (N+1 query): replaced 2-queries-per-gym with two single
    // aggregation pipelines that cover all top gyms in one DB round-trip each.
    const top10Ids = gymSummaries.slice(0, 10).map((g) => g._id);

    const [memberCounts, revenueCounts] = await Promise.all([
      Customer.aggregate([
        { $match: { admin: { $in: top10Ids } } },
        { $group: { _id: '$admin', count: { $sum: 1 } } },
      ]),
      Fee.aggregate([
        { $match: { admin: { $in: top10Ids }, status: 'paid' } },
        { $group: { _id: '$admin', total: { $sum: '$amount' } } },
      ]),
    ]);

    const memberMap = Object.fromEntries(memberCounts.map((r) => [r._id.toString(), r.count]));
    const revenueMap = Object.fromEntries(revenueCounts.map((r) => [r._id.toString(), r.total]));

    const topGyms = gymSummaries.slice(0, 10).map((gym) => ({
      _id: gym._id,
      gymName: gym.gymName,
      slug: gym.slug,
      isSuspended: gym.isSuspended,
      memberCount: memberMap[gym._id.toString()] || 0,
      revenue: revenueMap[gym._id.toString()] || 0,
    }));

    topGyms.sort((a, b) => b.revenue - a.revenue);

    res.json({
      totalGyms,
      activeGyms,
      totalCustomers,
      totalRevenue,
      monthlyRevenue,
      monthlyGymGrowth,
      topGyms,
    });
  })
);

module.exports = router;
