const express = require('express');
const crypto = require('crypto');

const User = require('../models/User');
const Customer = require('../models/Customer');
const MembershipPlan = require('../models/MembershipPlan');
const Fee = require('../models/Fee');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const WeightLog = require('../models/WeightLog');
const Streak = require('../models/Streak');
const Notification = require('../models/Notification');
const Trainer = require('../models/Trainer');
const Branch = require('../models/Branch');
const Attendance = require('../models/Attendance');

const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { attachAdminTenant } = require('../middleware/tenant');
const { sendEmail } = require('../utils/mailer');
const { welcomeEmail, announcementEmail, paymentReceiptEmail } = require('../utils/emailTemplates');
const { buildInstallQr } = require('../utils/installQr');
const { validate } = require('../middleware/validate');
const {
  createCustomerSchema,
  updateCustomerSchema,
  resetCustomerPasswordSchema,
  createTrainerSchema,
  updateTrainerSchema,
  createPlanSchema,
  updatePlanSchema,
  createFeeSchema,
  updateFeeSchema,
  bulkMemberBillingSchema,
  announcementSchema,
  createBranchSchema,
  updateBranchSchema,
  bulkActionSchema,
} = require('../schemas/adminSchemas');
const qrcode = require('qrcode');
const PDFDocument = require('pdfkit');

const router = express.Router();

// Every route below is an admin, scoped to their own gym via req.adminId.
router.use(protect, authorize('admin'), attachAdminTenant);

/* ------------------------------- Gym profile ------------------------------ */

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    res.json(req.adminDoc);
  })
);

router.put(
  '/profile',
  asyncHandler(async (req, res) => {
    // NOTE: `slug` is intentionally not accepted here — it's immutable
    // after creation (see models/Admin.js and superAdminRoutes.js).
    const {
      gymName,
      gymLogoUrl,
      address,
      contact,
      workingHours,
      themeColor,
      defaultMemberMonthlyFee,
      defaultFeeDueDay,
    } = req.body;
    if (gymName !== undefined) req.adminDoc.gymName = gymName;
    if (gymLogoUrl !== undefined) req.adminDoc.gymLogoUrl = gymLogoUrl;
    if (address !== undefined) req.adminDoc.address = address;
    if (contact !== undefined) req.adminDoc.contact = contact;
    if (workingHours !== undefined) req.adminDoc.workingHours = workingHours;
    if (themeColor !== undefined) req.adminDoc.themeColor = themeColor;
    if (defaultMemberMonthlyFee !== undefined) req.adminDoc.defaultMemberMonthlyFee = Number(defaultMemberMonthlyFee) || 3000;
    if (defaultFeeDueDay !== undefined) req.adminDoc.defaultFeeDueDay = Number(defaultFeeDueDay) || 10;
    await req.adminDoc.save();
    res.json(req.adminDoc);
  })
);

// Lets a gym owner pull up their own shareable install link + QR to print
// or display in-club (frontend-staff/src/pages/admin/GymProfile.jsx).
router.get(
  '/install-qr',
  asyncHandler(async (req, res) => {
    if (!req.adminDoc.slug) {
      return res.status(409).json({ message: 'No install slug yet — ask a super admin to run the slug backfill migration.' });
    }
    res.json(await buildInstallQr(req, req.adminDoc.slug));
  })
);

/* --------------------------- QR Code Check-In ------------------------------ */

router.get(
  '/checkin-qr',
  asyncHandler(async (req, res) => {
    let isTokenValid = Boolean(
      req.adminDoc.checkinToken &&
      req.adminDoc.checkinTokenExpiry &&
      new Date(req.adminDoc.checkinTokenExpiry) > new Date()
    );

    // Auto-generate fresh token for the new day if token is missing or expired upon date change
    if (!isTokenValid) {
      const token = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(23, 59, 59, 999);

      req.adminDoc.checkinToken = token;
      req.adminDoc.checkinTokenExpiry = expiresAt;
      await req.adminDoc.save();
      isTokenValid = true;
    }

    const origin = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;
    const gymSlugParam = req.adminDoc.slug ? `&gym=${req.adminDoc.slug}` : '';
    const checkinUrl = `${origin.replace(/\/$/, '')}/customer/checkin?token=${req.adminDoc.checkinToken}${gymSlugParam}`;
    const qrDataUrl = await qrcode.toDataURL(checkinUrl, { width: 320, margin: 2 });

    res.json({
      checkinTokenRequired: !!req.adminDoc.checkinTokenRequired,
      checkinToken: req.adminDoc.checkinToken || '',
      checkinTokenExpiry: req.adminDoc.checkinTokenExpiry,
      isTokenValid,
      qrDataUrl,
      checkinUrl,
    });
  })
);

router.post(
  '/checkin-qr',
  asyncHandler(async (req, res) => {
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999); // Expires at midnight date change

    req.adminDoc.checkinToken = token;
    req.adminDoc.checkinTokenExpiry = expiresAt;
    await req.adminDoc.save();

    const origin = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;
    const gymSlugParam = req.adminDoc.slug ? `&gym=${req.adminDoc.slug}` : '';
    const checkinUrl = `${origin.replace(/\/$/, '')}/customer/checkin?token=${token}${gymSlugParam}`;
    const qrDataUrl = await qrcode.toDataURL(checkinUrl, { width: 320, margin: 2 });

    res.json({
      message: 'New QR check-in token generated for today.',
      token,
      expiresAt,
      qrDataUrl,
      checkinUrl,
      checkinTokenRequired: req.adminDoc.checkinTokenRequired,
    });
  })
);

router.put(
  '/checkin-settings',
  asyncHandler(async (req, res) => {
    if (req.body.checkinTokenRequired !== undefined) {
      req.adminDoc.checkinTokenRequired = Boolean(req.body.checkinTokenRequired);
      await req.adminDoc.save();
    }
    res.json({
      checkinTokenRequired: req.adminDoc.checkinTokenRequired,
      message: 'Check-in settings updated.',
    });
  })
);

/* ------------------------------ Attendance -------------------------------- */

// GET /api/admin/attendance
// List check-in records for a specified date (defaults to today)
router.get(
  '/attendance',
  asyncHandler(async (req, res) => {
    const { date, search } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      admin: req.adminId,
      checkedInAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate({
        path: 'customer',
        select: 'name phone plan isActive',
        populate: { path: 'plan', select: 'planName' },
      })
      .sort({ checkedInAt: -1 });

    let filtered = attendanceRecords.filter((r) => r.customer);
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((r) => r.customer?.name?.toLowerCase().includes(q) || r.customer?.phone?.includes(q));
    }

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      totalToday: filtered.length,
      attendance: filtered,
    });
  })
);

// POST /api/admin/attendance/manual
// Front desk staff manually marks a member checked in
router.post(
  '/attendance/manual',
  asyncHandler(async (req, res) => {
    const { customerId, notes } = req.body;
    if (!customerId) return res.status(400).json({ message: 'customerId is required.' });

    const customer = await Customer.findOne({ _id: customerId, admin: req.adminId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const record = await Attendance.create({
      customer: customer._id,
      admin: req.adminId,
      method: 'manual',
      notes: notes ? notes.trim() : 'Manual reception check-in',
    });

    let streak = await Streak.findOne({ customer: customer._id });
    if (!streak) streak = new Streak({ customer: customer._id });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (streak.lastCheckin) {
      const last = new Date(streak.lastCheckin);
      last.setUTCHours(0, 0, 0, 0);
      const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak.currentStreak += 1;
      } else if (diffDays === 2) {
        const daysSinceLastRest = streak.lastRestDayUsed
          ? Math.round((today - new Date(streak.lastRestDayUsed)) / (1000 * 60 * 60 * 24))
          : 999;
        if (daysSinceLastRest >= 7) {
          streak.currentStreak += 1;
          streak.lastRestDayUsed = today;
          streak.restDaysUsed = (streak.restDaysUsed || 0) + 1;
        } else {
          streak.currentStreak = 1;
        }
      } else if (diffDays > 2) {
        streak.currentStreak = 1;
      }
    } else {
      streak.currentStreak = 1;
    }

    streak.lastCheckin = today;
    streak.totalCheckins = (streak.totalCheckins || 0) + 1;
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    await streak.save();

    const populated = await Attendance.findById(record._id).populate({
      path: 'customer',
      select: 'name phone plan',
      populate: { path: 'plan', select: 'planName' },
    });

    res.status(201).json({
      message: `${customer.name} checked in successfully.`,
      record: populated,
    });
  })
);

/* ---------------------------- Membership plans ---------------------------- */

router.get(
  '/plans',
  asyncHandler(async (req, res) => {
    const plans = await MembershipPlan.find({ admin: req.adminId }).sort({ price: 1 });
    res.json(plans);
  })
);

// BUG #13 FIX: Returns only active plans so inactive plans don't appear in
// customer-facing dropdowns. A separate /plans/all endpoint is available for
// the admin's own Plans management page.
router.get(
  '/plans/active',
  asyncHandler(async (req, res) => {
    const plans = await MembershipPlan.find({ admin: req.adminId, isActive: true }).sort({ price: 1 });
    res.json(plans);
  })
);

router.post(
  '/plans',
  validate(createPlanSchema),
  asyncHandler(async (req, res) => {
    const { planName, price, durationMonths } = req.body;
    if (!planName || price === undefined || !durationMonths) {
      return res.status(400).json({ message: 'planName, price and durationMonths are required.' });
    }
    const plan = await MembershipPlan.create({ admin: req.adminId, planName, price, durationMonths });
    res.status(201).json(plan);
  })
);

router.put(
  '/plans/:id',
  validate(updatePlanSchema),
  asyncHandler(async (req, res) => {
    const plan = await MembershipPlan.findOne({ _id: req.params.id, admin: req.adminId });
    if (!plan) return res.status(404).json({ message: 'Plan not found.' });
    const { planName, price, durationMonths, isActive } = req.body;
    if (planName !== undefined) plan.planName = planName;
    if (price !== undefined) plan.price = price;
    if (durationMonths !== undefined) plan.durationMonths = durationMonths;
    if (isActive !== undefined) plan.isActive = isActive;
    await plan.save();
    res.json(plan);
  })
);

router.delete(
  '/plans/:id',
  asyncHandler(async (req, res) => {
    const plan = await MembershipPlan.findOneAndDelete({ _id: req.params.id, admin: req.adminId });
    if (!plan) return res.status(404).json({ message: 'Plan not found.' });
    res.json({ message: 'Plan deleted.' });
  })
);

/* -------------------------------- Customers -------------------------------- */

// GET /api/admin/customers?status=active|inactive|overdue&search=jane
router.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const query = { admin: req.adminId };
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) query.name = { $regex: search, $options: 'i' };

    let customers = await Customer.find(query)
      .populate('user', 'username email isActive created_at')
      .populate('plan')
      .sort({ created_at: -1 })
      .lean();

    // Attach latest fee and computed feeStatus in a single DB query
    const customerIds = customers.map((c) => c._id);
    const fees = await Fee.find({ admin: req.adminId, customer: { $in: customerIds } })
      .sort({ dueDate: -1, created_at: -1 })
      .lean();

    const latestFeeMap = {};
    for (const f of fees) {
      const cid = f.customer.toString();
      if (!latestFeeMap[cid]) {
        latestFeeMap[cid] = f;
      }
    }

    const now = new Date();
    customers = customers.map((c) => {
      const cid = c._id.toString();
      const latestFee = latestFeeMap[cid] || null;
      let feeStatus = 'none';

      if (latestFee) {
        if (latestFee.status === 'paid') {
          const expDate = c.membershipExpiresAt ? new Date(c.membershipExpiresAt) : new Date(latestFee.dueDate);
          const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) {
            feeStatus = 'overdue';
          } else if (daysLeft <= 5) {
            feeStatus = 'due_soon';
          } else {
            feeStatus = 'paid';
          }
        } else if (latestFee.status === 'overdue') {
          feeStatus = 'overdue';
        } else if (latestFee.status === 'unpaid') {
          if (new Date(latestFee.dueDate) < now) {
            feeStatus = 'overdue';
          } else {
            feeStatus = 'unpaid';
          }
        } else {
          feeStatus = latestFee.status;
        }
      }

      return {
        ...c,
        latestFee,
        feeStatus,
      };
    });

    if (status === 'overdue') {
      customers = customers.filter((c) => c.feeStatus === 'overdue');
    }

    res.json(customers);
  })
);

// Create a customer: makes a User (role=customer) + Customer + Streak + optional initial Fee in one step.
router.post(
  '/customers',
  validate(createCustomerSchema),
  asyncHandler(async (req, res) => {
    const { username, password, name, phone, email, planId, monthlyFee, admissionFee, initialFee } = req.body;
    if (!username || !name) {
      return res.status(400).json({ message: 'Username and name are required.' });
    }

    const isAutoPassword = !password || password.trim() === '';
    const effectivePassword = isAutoPassword ? crypto.randomBytes(5).toString('base64url') : password.trim();
    if (effectivePassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ username: username.trim().toLowerCase(), admin: req.adminId });
    if (existing) return res.status(409).json({ message: 'That username is already taken in your gym.' });

    const recipientEmail = (email || (username.includes('@') ? username : '')).trim().toLowerCase() || null;
    const passwordHash = await User.hashPassword(effectivePassword);
    const user = await User.create({
      username: username.trim().toLowerCase(),
      email: recipientEmail,
      passwordHash,
      role: 'customer',
      admin: req.adminId,
    });

    const standardMonthlyFee = monthlyFee != null ? Number(monthlyFee) : (req.adminDoc?.defaultMemberMonthlyFee || 3000);
    const joiningFee = admissionFee != null ? Number(admissionFee) : 0;

    const customer = await Customer.create({
      user: user._id,
      admin: req.adminId,
      name: name.trim(),
      phone: phone || '',
      plan: planId || null,
      monthlyFee: standardMonthlyFee,
      admissionFee: joiningFee,
    });
    await Streak.create({ customer: customer._id });

    // Atomic initial fee creation if requested
    let createdFee = null;
    if (initialFee && initialFee.collectNow !== false) {
      const isPaid = initialFee.status === 'paid';
      const receiptNo = isPaid ? await Fee.generateReceiptNumber(req.adminId) : '';
      const due = initialFee.dueDate ? new Date(initialFee.dueDate) : new Date(Date.now() + 30 * 86400000);
      const totalAmount = Number(initialFee.amount) || standardMonthlyFee;
      const initialAdm = Number(initialFee.admissionFee) || joiningFee;
      const initialDisc = Number(initialFee.discount) || 0;

      createdFee = await Fee.create({
        customer: customer._id,
        admin: req.adminId,
        title: initialFee.title || 'Initial Monthly Subscription',
        feeType: 'subscription',
        billingMonth: initialFee.billingMonth || new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        amount: totalAmount + initialAdm - initialDisc,
        admissionFee: initialAdm,
        discount: initialDisc,
        dueDate: due,
        status: isPaid ? 'paid' : 'unpaid',
        paymentMethod: isPaid ? initialFee.paymentMethod || 'cash' : null,
        paidOn: isPaid ? new Date() : null,
        receiptNumber: receiptNo,
        notes: initialFee.notes || '',
      });

      if (isPaid) {
        customer.membershipExpiresAt = new Date(Date.now() + 30 * 86400000);
        await customer.save();
      }
    }

    if (recipientEmail) {
      sendEmail({
        to: recipientEmail,
        subject: `Welcome to ${req.adminDoc?.gymName || 'Ironline Gym'}!`,
        html: welcomeEmail(name, req.adminDoc?.gymName, user.username),
      }).catch((err) => console.error('[mailer] Welcome email failed:', err.message));
    }

    const resData = customer.toObject();
    resData.user = { _id: user._id, username: user.username, email: user.email };
    resData.generatedPassword = isAutoPassword ? effectivePassword : null;
    resData.initialFee = createdFee;

    res.status(201).json(resData);
  })
);

router.get(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, admin: req.adminId }).populate('plan');
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.json(customer);
  })
);

router.put(
  '/customers/:id',
  validate(updateCustomerSchema),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, admin: req.adminId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    const { name, phone, planId, monthlyFee, admissionFee, isActive } = req.body;
    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (planId !== undefined) customer.plan = planId || null;
    if (monthlyFee !== undefined) customer.monthlyFee = Number(monthlyFee);
    if (admissionFee !== undefined) customer.admissionFee = Number(admissionFee);
    if (isActive !== undefined) customer.isActive = isActive;
    await customer.save();
    res.json(customer);
  })
);

// PUT /api/admin/customers/:id/reset-password
// Admin resets a customer's password directly — no email needed.
// newPassword is OPTIONAL: if omitted or blank, a random one is generated
// and returned in the response so the admin can relay it to the member in person.
router.put(
  '/customers/:id/reset-password',
  validate(resetCustomerPasswordSchema),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, admin: req.adminId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const userDoc = await User.findById(customer.user);
    if (!userDoc) return res.status(404).json({ message: 'User account not found.' });

    // Use provided password or auto-generate an 8-char random one
    const isAutoGenerated = !req.body.newPassword || req.body.newPassword.trim() === '';
    const newPassword = isAutoGenerated
      ? crypto.randomBytes(5).toString('base64url') // ~7-8 chars, URL-safe
      : req.body.newPassword.trim();

    userDoc.passwordHash = await User.hashPassword(newPassword);
    await userDoc.save();

    res.json({
      message: `Password reset successfully for ${customer.name}.`,
      newPassword,           // Shown on screen for admin to hand to member
      isAutoGenerated,
      memberName: customer.name,
      username: userDoc.username,
    });
  })
);

// POST /api/admin/customers/bulk-action
// Perform an action on multiple customers at once.
router.post(
  '/customers/bulk-action',
  validate(bulkActionSchema),
  asyncHandler(async (req, res) => {
    const { ids, action, message } = req.body;

    // Ensure all IDs belong to this gym
    const customers = await Customer.find({ _id: { $in: ids }, admin: req.adminId }).populate('user', 'email');
    if (customers.length === 0) return res.status(404).json({ message: 'No matching customers found.' });

    let affected = 0;

    if (action === 'activate' || action === 'deactivate') {
      const isActive = action === 'activate';
      await Customer.updateMany({ _id: { $in: ids }, admin: req.adminId }, { isActive });
      affected = customers.length;
    } else if (action === 'send-announcement') {
      const docs = customers.map((c) => ({ user: c.user?._id, type: 'admin_alert', message }));
      if (docs.length) await Notification.insertMany(docs.filter((d) => d.user));
      affected = docs.length;
    }

    res.json({ message: `Bulk action '${action}' applied to ${affected} customer(s).`, affected });
  })
);

// POST /api/admin/customers/import
// Bulk import members from CSV data or row objects
router.post(
  '/customers/import',
  asyncHandler(async (req, res) => {
    let rows = [];
    if (Array.isArray(req.body.rows)) {
      rows = req.body.rows;
    } else if (req.body.csvData && typeof req.body.csvData === 'string') {
      const lines = req.body.csvData.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] || '';
          });
          rows.push(rowObj);
        }
      }
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No valid data provided for import.' });
    }

    const createdList = [];
    const skippedList = [];

    for (const row of rows) {
      const name = (row.name || row.fullname || '').trim();
      const username = (row.username || row.user || '').trim().toLowerCase();
      const phone = (row.phone || row.mobile || '').trim();
      const rawPassword = (row.password || '').trim();

      if (!name || !username) {
        skippedList.push({ name: name || 'Unknown', username, reason: 'Missing name or username' });
        continue;
      }

      const existing = await User.findOne({ username, admin: req.adminId });
      if (existing) {
        skippedList.push({ name, username, reason: 'Username already taken' });
        continue;
      }

      const isAuto = !rawPassword || rawPassword.length < 8;
      const effectivePassword = isAuto ? crypto.randomBytes(5).toString('base64url') : rawPassword;
      const passwordHash = await User.hashPassword(effectivePassword);

      const user = await User.create({
        username,
        passwordHash,
        role: 'customer',
        admin: req.adminId,
      });

      const customer = await Customer.create({
        user: user._id,
        admin: req.adminId,
        name,
        phone,
      });

      await Streak.create({ customer: customer._id });

      createdList.push({
        _id: customer._id,
        name,
        username,
        password: isAuto ? effectivePassword : 'Provided in CSV',
      });
    }

    res.json({
      message: `Import completed: ${createdList.length} member(s) created, ${skippedList.length} skipped.`,
      createdCount: createdList.length,
      skippedCount: skippedList.length,
      created: createdList,
      skipped: skippedList,
    });
  })
);

router.delete(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, admin: req.adminId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    // BUG #6 FIX: Remove the customer and ALL data scoped to them, including
    // Notifications (previously omitted, leaving orphaned records in the DB).
    await Promise.all([
      Customer.deleteOne({ _id: customer._id }),
      User.deleteOne({ _id: customer.user }),
      Fee.deleteMany({ customer: customer._id }),
      WorkoutLog.deleteMany({ customer: customer._id }),
      DietLog.deleteMany({ customer: customer._id }),
      WeightLog.deleteMany({ customer: customer._id }),
      Streak.deleteMany({ customer: customer._id }),
      Notification.deleteMany({ user: customer.user }), // was missing before
    ]);
    res.json({ message: 'Customer removed.' });
  })
);

/* ----------------------- Read-only progress monitoring --------------------- */

router.get(
  '/customers/:id/progress',
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, admin: req.adminId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const [workouts, diet, weight, streak] = await Promise.all([
      WorkoutLog.find({ customer: customer._id }).sort({ date: -1 }).limit(30),
      DietLog.find({ customer: customer._id }).sort({ date: -1 }).limit(30),
      WeightLog.find({ customer: customer._id }).sort({ date: -1 }).limit(30),
      Streak.findOne({ customer: customer._id }),
    ]);
    res.json({ workouts, diet, weight, streak });
  })
);

router.put(
  '/customers/:id/flag-inactive',
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, admin: req.adminId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    customer.isActive = false;
    await customer.save();
    res.json(customer);
  })
);

/* ---------------------------------- Fees ----------------------------------- */

// GET /api/admin/fees?status=unpaid&customerId=...&billingMonth=...
router.get(
  '/fees',
  asyncHandler(async (req, res) => {
    const { status, customerId, billingMonth, search } = req.query;
    const query = { admin: req.adminId };
    if (status && status !== 'all') query.status = status;
    if (customerId) query.customer = customerId;
    if (billingMonth) query.billingMonth = billingMonth;

    let fees = await Fee.find(query)
      .populate({
        path: 'customer',
        select: 'name phone monthlyFee membershipExpiresAt',
        populate: { path: 'user', select: 'username email' },
      })
      .sort({ dueDate: -1, created_at: -1 })
      .lean();

    if (search) {
      const q = search.toLowerCase();
      fees = fees.filter(
        (f) =>
          f.customer?.name?.toLowerCase().includes(q) ||
          f.customer?.phone?.includes(q) ||
          f.receiptNumber?.toLowerCase().includes(q) ||
          f.invoiceNumber?.toLowerCase().includes(q) ||
          f.title?.toLowerCase().includes(q)
      );
    }

    res.json(fees);
  })
);

// GET /api/admin/fees/stats — summary metrics for the gym dashboard
router.get(
  '/fees/stats',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allFees, activeMemberCount] = await Promise.all([
      Fee.find({ admin: req.adminId }).lean(),
      Customer.countDocuments({ admin: req.adminId, isActive: true }),
    ]);

    let totalPaidThisMonth = 0;
    let totalUnpaidAmount = 0;
    let overdueCount = 0;
    let paidCount = 0;

    for (const f of allFees) {
      if (f.status === 'paid') {
        paidCount++;
        if (f.paidOn && new Date(f.paidOn) >= startOfMonth) {
          totalPaidThisMonth += f.amount;
        }
      } else if (f.status === 'unpaid' || f.status === 'overdue') {
        totalUnpaidAmount += f.amount;
        if (f.status === 'overdue' || new Date(f.dueDate) < now) {
          overdueCount++;
        }
      }
    }

    res.json({
      totalPaidThisMonth,
      totalUnpaidAmount,
      overdueCount,
      paidCount,
      activeMemberCount,
      totalFeesCount: allFees.length,
    });
  })
);

// POST /api/admin/fees — manual fee creation for a member
router.post(
  '/fees',
  validate(createFeeSchema),
  asyncHandler(async (req, res) => {
    const {
      customerId,
      title,
      feeType = 'subscription',
      billingMonth,
      amount,
      admissionFee = 0,
      discount = 0,
      dueDate,
      status = 'unpaid',
      paymentMethod,
      notes = '',
      isRecurring = false,
    } = req.body;

    const customer = await Customer.findOne({ _id: customerId, admin: req.adminId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const isPaid = status === 'paid';
    const invoiceNo = await Fee.generateReceiptNumber(req.adminId);
    const finalMonth = billingMonth || new Date(dueDate).toLocaleString('en-US', { month: 'short', year: 'numeric' });

    const fee = await Fee.create({
      customer: customer._id,
      admin: req.adminId,
      invoiceNumber: invoiceNo,
      title: title || (feeType === 'subscription' ? `Monthly Subscription — ${finalMonth}` : 'Gym Fee'),
      feeType,
      billingMonth: finalMonth,
      amount: Number(amount) + Number(admissionFee) - Number(discount),
      admissionFee: Number(admissionFee),
      discount: Number(discount),
      dueDate: new Date(dueDate),
      status: isPaid ? 'paid' : 'unpaid',
      paymentMethod: isPaid ? paymentMethod || 'cash' : null,
      paidOn: isPaid ? new Date() : null,
      receiptNumber: isPaid ? invoiceNo : '',
      notes,
      isRecurring: !!isRecurring,
    });

    if (isPaid) {
      customer.membershipExpiresAt = new Date(Date.now() + 30 * 86400000);
      await customer.save();
    }

    const populated = await Fee.findById(fee._id).populate('customer', 'name phone');
    res.status(201).json(populated);
  })
);

// POST /api/admin/fees/bulk — batch generate monthly invoices for all active members
router.post(
  '/fees/bulk',
  validate(bulkMemberBillingSchema),
  asyncHandler(async (req, res) => {
    const { billingMonth, dueDate, title, defaultAmount } = req.body;

    const activeCustomers = await Customer.find({ admin: req.adminId, isActive: true });
    let createdCount = 0;
    let skippedCount = 0;

    for (const cust of activeCustomers) {
      // Check if already invoiced for this month & feeType='subscription'
      const existing = await Fee.findOne({
        admin: req.adminId,
        customer: cust._id,
        billingMonth,
        feeType: 'subscription',
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const feeAmount =
        cust.monthlyFee != null
          ? cust.monthlyFee
          : defaultAmount != null
          ? defaultAmount
          : req.adminDoc.defaultMemberMonthlyFee || 3000;

      const invoiceNo = await Fee.generateReceiptNumber(req.adminId);
      await Fee.create({
        customer: cust._id,
        admin: req.adminId,
        invoiceNumber: invoiceNo,
        title: title || `Monthly Subscription — ${billingMonth}`,
        feeType: 'subscription',
        billingMonth,
        amount: feeAmount,
        dueDate: new Date(dueDate),
        status: 'unpaid',
      });

      createdCount++;
    }

    res.json({
      message: `Bulk monthly invoicing complete: ${createdCount} created, ${skippedCount} skipped (already invoiced).`,
      createdCount,
      skippedCount,
    });
  })
);

// PUT /api/admin/fees/:id — update or mark fee as paid
router.put(
  '/fees/:id',
  validate(updateFeeSchema),
  asyncHandler(async (req, res) => {
    const fee = await Fee.findOne({ _id: req.params.id, admin: req.adminId });
    if (!fee) return res.status(404).json({ message: 'Fee record not found.' });

    const { status, amount, dueDate, paymentMethod, notes } = req.body;
    if (amount !== undefined) fee.amount = amount;
    if (dueDate !== undefined) fee.dueDate = new Date(dueDate);
    if (paymentMethod !== undefined) fee.paymentMethod = paymentMethod;
    if (notes !== undefined) fee.notes = notes;

    if (status !== undefined) {
      fee.status = status;
      if (status === 'paid') {
        fee.paidOn = new Date();
        fee.paymentMethod = paymentMethod || fee.paymentMethod || 'cash';
        if (!fee.receiptNumber) {
          fee.receiptNumber = await Fee.generateReceiptNumber(req.adminId);
        }

        // Update customer membership expiration
        const customer = await Customer.findById(fee.customer).populate('user', 'email username');
        if (customer) {
          customer.membershipExpiresAt = new Date(Date.now() + 30 * 86400000);
          await customer.save();

          if (customer.user?.email) {
            sendEmail({
              to: customer.user.email,
              subject: `Payment Receipt — ${req.adminDoc?.gymName || 'Ironline Gym'}`,
              html: paymentReceiptEmail(customer.name, fee.amount, fee.receiptNumber, req.adminDoc?.gymName),
            }).catch((err) => console.error('[mailer] Receipt email failed:', err.message));
          }
        }
      } else {
        fee.paidOn = null;
      }
    }

    await fee.save();
    const updated = await Fee.findById(fee._id).populate('customer', 'name phone');
    res.json(updated);
  })
);

router.get(
  '/fees/export',
  asyncHandler(async (req, res) => {
    const { format = 'csv', status, from, to } = req.query;
    const query = { admin: req.adminId };
    if (status) query.status = status;
    if (from || to) {
      query.dueDate = {};
      if (from) query.dueDate.$gte = new Date(from);
      if (to) query.dueDate.$lte = new Date(to);
    }

    const fees = await Fee.find(query)
      .populate('customer', 'name phone')
      .sort({ dueDate: -1 });

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="fees-report-${Date.now()}.pdf"`);
      doc.pipe(res);

      // Gym header
      doc.fontSize(20).fillColor('#111827').text(req.adminDoc?.gymName || 'Ironline Gym', { align: 'left' });
      doc.fontSize(12).fillColor('#4B5563').text('Fee & Revenue Report', { align: 'left' });
      doc.fontSize(9).fillColor('#9CA3AF').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'left' });
      doc.moveDown(1.2);

      // Summary totals
      const totalPaid = fees.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
      const totalUnpaid = fees.filter((f) => f.status !== 'paid').reduce((s, f) => s + f.amount, 0);
      doc
        .fontSize(10)
        .fillColor('#111827')
        .text(
          `Total Records: ${fees.length}  |  Collected: Rs. ${totalPaid.toFixed(2)}  |  Pending/Overdue: Rs. ${totalUnpaid.toFixed(2)}`
        );
      doc.moveDown(0.8);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151');
      doc.text('Receipt #', 40, tableTop, { width: 90 });
      doc.text('Customer', 130, tableTop, { width: 120 });
      doc.text('Amount (PKR)', 250, tableTop, { width: 65 });
      doc.text('Status', 320, tableTop, { width: 55 });
      doc.text('Due Date', 380, tableTop, { width: 75 });
      doc.text('Paid On', 460, tableTop, { width: 95 });
      doc.moveDown(0.5);
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // Table Rows
      doc.font('Helvetica').fontSize(8).fillColor('#1F2937');
      fees.forEach((f) => {
        if (doc.y > 740) {
          doc.addPage();
        }
        const y = doc.y;
        doc.text(f.receiptNumber || '—', 40, y, { width: 90 });
        doc.text(f.customer?.name || 'Unknown', 130, y, { width: 120 });
        doc.text(`Rs. ${f.amount.toFixed(2)}`, 250, y, { width: 65 });
        doc.text(f.status.toUpperCase(), 320, y, { width: 55 });
        doc.text(new Date(f.dueDate).toISOString().split('T')[0], 380, y, { width: 75 });
        doc.text(f.paidOn ? new Date(f.paidOn).toISOString().split('T')[0] : '—', 460, y, { width: 95 });
        doc.moveDown(0.7);
      });

      doc.end();
      return;
    }

    // Default: CSV export
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fees-export-${Date.now()}.csv"`);

    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
    const headers = ['Receipt Number', 'Customer Name', 'Phone', 'Amount (PKR)', 'Status', 'Due Date', 'Paid On'];
    const rows = fees.map((f) => [
      escapeCsv(f.receiptNumber),
      escapeCsv(f.customer?.name),
      escapeCsv(f.customer?.phone),
      f.amount.toFixed(2),
      f.status,
      f.dueDate ? new Date(f.dueDate).toISOString().split('T')[0] : '',
      f.paidOn ? new Date(f.paidOn).toISOString().split('T')[0] : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.send(csvContent);
  })
);

// Simple revenue report: totals grouped by status, for the date range given.
router.get(
  '/fees-report',
  asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const match = { admin: req.adminId };
    if (from || to) {
      match.dueDate = {};
      if (from) match.dueDate.$gte = new Date(from);
      if (to) match.dueDate.$lte = new Date(to);
    }
    const rows = await Fee.aggregate([
      { $match: match },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    res.json(rows);
  })
);

// GET /api/admin/analytics
// Pre-aggregated statistics for admin dashboard charts & KPI tiles
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      activeCount,
      inactiveCount,
      paidFees,
      unpaidFees,
      monthlyRevenueRaw,
      monthlyMembersRaw,
      planAggRaw,
    ] = await Promise.all([
      Customer.countDocuments({ admin: req.adminId, isActive: true }),
      Customer.countDocuments({ admin: req.adminId, isActive: false }),
      Fee.aggregate([
        { $match: { admin: req.adminId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Fee.aggregate([
        { $match: { admin: req.adminId, status: { $in: ['unpaid', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Fee.aggregate([
        {
          $match: {
            admin: req.adminId,
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
      Customer.aggregate([
        {
          $match: {
            admin: req.adminId,
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
      Customer.aggregate([
        { $match: { admin: req.adminId } },
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = paidFees[0]?.total || 0;
    const pendingRevenue = unpaidFees[0]?.total || 0;
    const totalDue = totalRevenue + pendingRevenue;
    const feeCollectionRate = totalDue > 0 ? Number((totalRevenue / totalDue).toFixed(2)) : 1;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth = [];
    const memberGrowthByMonth = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const label = `${monthNames[m - 1]} ${y}`;

      const revMatch = monthlyRevenueRaw.find((r) => r._id.year === y && r._id.month === m);
      revenueByMonth.push({
        month: label,
        revenue: revMatch ? revMatch.revenue : 0,
      });

      const memMatch = monthlyMembersRaw.find((r) => r._id.year === y && r._id.month === m);
      memberGrowthByMonth.push({
        month: label,
        count: memMatch ? memMatch.count : 0,
      });
    }

    const plans = await MembershipPlan.find({ admin: req.adminId }).lean();
    const planMap = new Map(plans.map((p) => [p._id.toString(), p.planName]));
    const planDistribution = planAggRaw.map((item) => ({
      name: item._id ? planMap.get(item._id.toString()) || 'Unknown Plan' : 'No Plan',
      count: item.count,
    }));

    res.json({
      revenueByMonth,
      memberGrowthByMonth,
      activeVsInactive: {
        active: activeCount,
        inactive: inactiveCount,
      },
      planDistribution,
      totalRevenue,
      pendingRevenue,
      feeCollectionRate,
    });
  })
);

/* ------------------------------ Announcements ------------------------------ */

router.post(
  '/announcements',
  validate(announcementSchema),
  asyncHandler(async (req, res) => {
    const { message, sendEmail: doSendEmail } = req.body;
    if (!message) return res.status(400).json({ message: 'message is required.' });

    const customers = await Customer.find({ admin: req.adminId }).select('user name').populate('user', 'email');
    const docs = customers.map((c) => ({ user: c.user?._id, type: 'admin_alert', message }));
    if (docs.length) await Notification.insertMany(docs.filter((d) => d.user));

    let emailsSent = 0;
    if (doSendEmail) {
      const emailCustomers = customers.filter((c) => c.user?.email);
      await Promise.allSettled(
        emailCustomers.map((c) =>
          sendEmail({
            to: c.user.email,
            subject: `Announcement from ${req.adminDoc?.gymName || 'Your Gym'}`,
            html: announcementEmail(req.adminDoc?.gymName, 'Gym Announcement', message),
          }).then((r) => { if (r?.success) emailsSent++; })
        )
      );
    }

    res.status(201).json({
      message: `Announcement sent to ${docs.length} customer(s).`,
      notified: docs.length,
      emailsSent,
    });
  })
);

/* -------------------------------- Trainers --------------------------------- */

router.get(
  '/trainers',
  asyncHandler(async (req, res) => {
    const trainers = await Trainer.find({ admin: req.adminId })
      .populate('user', 'username email isActive')
      .populate('assignedCustomers', 'name phone');
    res.json(trainers);
  })
);

router.post(
  '/trainers',
  validate(createTrainerSchema),
  asyncHandler(async (req, res) => {
    const { username, password, name, phone, specialty, bio, assignedCustomers } = req.body;
    if (!username || !name) {
      return res.status(400).json({ message: 'Username and name are required.' });
    }

    const isAutoPassword = !password || password.trim() === '';
    const effectivePassword = isAutoPassword ? crypto.randomBytes(5).toString('base64url') : password.trim();
    if (effectivePassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ username: username.trim().toLowerCase(), admin: req.adminId });
    if (existing) return res.status(409).json({ message: 'That username is already taken in your gym.' });

    const passwordHash = await User.hashPassword(effectivePassword);
    const user = await User.create({
      username: username.trim().toLowerCase(),
      email: username.includes('@') ? username.trim().toLowerCase() : undefined,
      passwordHash,
      role: 'trainer',
      admin: req.adminId,
    });

    const trainer = await Trainer.create({
      user: user._id,
      admin: req.adminId,
      name: name.trim(),
      phone: phone || '',
      specialty: specialty || 'General Fitness',
      bio: bio || '',
      assignedCustomers: Array.isArray(assignedCustomers) ? assignedCustomers : [],
    });

    const populated = await Trainer.findById(trainer._id)
      .populate('user', 'username email isActive')
      .populate('assignedCustomers', 'name phone');

    const resData = populated.toObject();
    resData.generatedPassword = isAutoPassword ? effectivePassword : null;

    res.status(201).json(resData);
  })
);

router.put(
  '/trainers/:id',
  validate(updateTrainerSchema),
  asyncHandler(async (req, res) => {
    const trainer = await Trainer.findOne({ _id: req.params.id, admin: req.adminId });
    if (!trainer) return res.status(404).json({ message: 'Trainer not found.' });

    const { name, phone, specialty, bio, assignedCustomers, isActive } = req.body;
    if (name !== undefined) trainer.name = name.trim();
    if (phone !== undefined) trainer.phone = phone;
    if (specialty !== undefined) trainer.specialty = specialty;
    if (bio !== undefined) trainer.bio = bio;
    if (assignedCustomers !== undefined && Array.isArray(assignedCustomers)) {
      trainer.assignedCustomers = assignedCustomers;
    }
    if (isActive !== undefined) {
      trainer.isActive = Boolean(isActive);
      await User.findByIdAndUpdate(trainer.user, { isActive: trainer.isActive });
    }

    await trainer.save();
    const populated = await Trainer.findById(trainer._id)
      .populate('user', 'username email isActive')
      .populate('assignedCustomers', 'name phone');

    res.json(populated);
  })
);

router.delete(
  '/trainers/:id',
  asyncHandler(async (req, res) => {
    const trainer = await Trainer.findOne({ _id: req.params.id, admin: req.adminId });
    if (!trainer) return res.status(404).json({ message: 'Trainer not found.' });

    await User.findByIdAndDelete(trainer.user);
    await Trainer.findByIdAndDelete(trainer._id);
    res.json({ message: 'Trainer account removed.' });
  })
);

/* -------------------------------- Branches --------------------------------- */

router.get(
  '/branches',
  asyncHandler(async (req, res) => {
    const branches = await Branch.find({ admin: req.adminId }).sort({ createdAt: -1 });
    res.json(branches);
  })
);

router.post(
  '/branches',
  validate(createBranchSchema),
  asyncHandler(async (req, res) => {
    const { name, address, phone, managerName, operatingHours, capacity } = req.body;
    if (!name) return res.status(400).json({ message: 'Branch name is required.' });

    const branch = await Branch.create({
      admin: req.adminId,
      name: name.trim(),
      address: address || '',
      phone: phone || '',
      managerName: managerName || '',
      operatingHours: operatingHours || '6:00 AM - 10:00 PM',
      capacity: capacity ? Number(capacity) : 100,
    });

    res.status(201).json(branch);
  })
);

router.put(
  '/branches/:id',
  validate(updateBranchSchema),
  asyncHandler(async (req, res) => {
    const branch = await Branch.findOne({ _id: req.params.id, admin: req.adminId });
    if (!branch) return res.status(404).json({ message: 'Branch not found.' });

    const { name, address, phone, managerName, operatingHours, capacity, isActive } = req.body;
    if (name !== undefined) branch.name = name.trim();
    if (address !== undefined) branch.address = address;
    if (phone !== undefined) branch.phone = phone;
    if (managerName !== undefined) branch.managerName = managerName;
    if (operatingHours !== undefined) branch.operatingHours = operatingHours;
    if (capacity !== undefined) branch.capacity = Number(capacity);
    if (isActive !== undefined) branch.isActive = Boolean(isActive);

    await branch.save();
    res.json(branch);
  })
);

router.delete(
  '/branches/:id',
  asyncHandler(async (req, res) => {
    const branch = await Branch.findOne({ _id: req.params.id, admin: req.adminId });
    if (!branch) return res.status(404).json({ message: 'Branch not found.' });

    await Branch.findByIdAndDelete(branch._id);
    res.json({ message: 'Branch removed.' });
  })
);

module.exports = router;

