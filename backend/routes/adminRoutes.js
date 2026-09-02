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

const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { attachAdminTenant } = require('../middleware/tenant');

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
    const { gymName, gymLogoUrl, address, contact, workingHours } = req.body;
    if (gymName !== undefined) req.adminDoc.gymName = gymName;
    if (gymLogoUrl !== undefined) req.adminDoc.gymLogoUrl = gymLogoUrl;
    if (address !== undefined) req.adminDoc.address = address;
    if (contact !== undefined) req.adminDoc.contact = contact;
    if (workingHours !== undefined) req.adminDoc.workingHours = workingHours;
    await req.adminDoc.save();
    res.json(req.adminDoc);
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

router.post(
  '/plans',
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

// GET /api/admin/customers?status=active|expired|overdue&search=jane
router.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const query = { admin: req.adminId };
    if (status === 'active') query.isActive = true;
    if (status === 'expired') query.isActive = false;
    if (search) query.name = { $regex: search, $options: 'i' };

    let customers = await Customer.find(query).populate('plan').sort({ created_at: -1 });

    if (status === 'overdue') {
      const overdueCustomerIds = await Fee.find({ admin: req.adminId, status: 'overdue' }).distinct('customer');
      const overdueSet = new Set(overdueCustomerIds.map(String));
      customers = customers.filter((c) => overdueSet.has(String(c._id)));
    }

    res.json(customers);
  })
);

// Create a customer: makes a User (role=customer) + linked Customer doc in one step.
router.post(
  '/customers',
  asyncHandler(async (req, res) => {
    const { username, password, name, phone, planId } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ message: 'username, password and name are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'That username is already taken.' });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ username: username.trim().toLowerCase(), passwordHash, role: 'customer' });

    const customer = await Customer.create({
      user: user._id,
      admin: req.adminId,
      name,
      phone: phone || '',
      plan: planId || null,
    });
    await Streak.create({ customer: customer._id });

    res.status(201).json(customer);
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
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, admin: req.adminId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    const { name, phone, planId, isActive } = req.body;
    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (planId !== undefined) customer.plan = planId || null;
    if (isActive !== undefined) customer.isActive = isActive;
    await customer.save();
    res.json(customer);
  })
);

router.delete(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, admin: req.adminId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    // Remove the customer and everything scoped to them.
    await Promise.all([
      Customer.deleteOne({ _id: customer._id }),
      User.deleteOne({ _id: customer.user }),
      Fee.deleteMany({ customer: customer._id }),
      WorkoutLog.deleteMany({ customer: customer._id }),
      DietLog.deleteMany({ customer: customer._id }),
      WeightLog.deleteMany({ customer: customer._id }),
      Streak.deleteMany({ customer: customer._id }),
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

// GET /api/admin/fees?status=unpaid
router.get(
  '/fees',
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const query = { admin: req.adminId };
    if (status) query.status = status;
    const fees = await Fee.find(query).populate('customer', 'name phone').sort({ dueDate: 1 });
    res.json(fees);
  })
);

router.post(
  '/fees',
  asyncHandler(async (req, res) => {
    const { customerId, amount, dueDate, isRecurring } = req.body;
    if (!customerId || amount === undefined || !dueDate) {
      return res.status(400).json({ message: 'customerId, amount and dueDate are required.' });
    }
    const customer = await Customer.findOne({ _id: customerId, admin: req.adminId });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const fee = await Fee.create({
      customer: customer._id,
      admin: req.adminId,
      amount,
      dueDate,
      isRecurring: !!isRecurring,
    });
    res.status(201).json(fee);
  })
);

router.put(
  '/fees/:id',
  asyncHandler(async (req, res) => {
    const fee = await Fee.findOne({ _id: req.params.id, admin: req.adminId });
    if (!fee) return res.status(404).json({ message: 'Fee record not found.' });

    const { status, amount, dueDate } = req.body;
    if (amount !== undefined) fee.amount = amount;
    if (dueDate !== undefined) fee.dueDate = dueDate;
    if (status !== undefined) {
      fee.status = status;
      if (status === 'paid') {
        fee.paidOn = new Date();
        fee.receiptNumber = fee.receiptNumber || `RCPT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      }
      if (status !== 'paid') {
        fee.paidOn = null;
      }
    }
    await fee.save();
    res.json(fee);
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

/* ------------------------------ Announcements ------------------------------ */

// Broadcasts a notification to every customer belonging to this gym.
router.post(
  '/announcements',
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'message is required.' });

    const customers = await Customer.find({ admin: req.adminId }).select('user');
    const docs = customers.map((c) => ({ user: c.user, type: 'admin_alert', message }));
    if (docs.length) await Notification.insertMany(docs);
    res.status(201).json({ message: `Announcement sent to ${docs.length} customer(s).` });
  })
);

module.exports = router;
