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

const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { attachAdminTenant } = require('../middleware/tenant');
const { sendEmail } = require('../utils/mailer');
const { welcomeEmail } = require('../utils/emailTemplates');
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

/* --------------------------- QR Code Check-In ------------------------------ */

router.get(
  '/checkin-qr',
  asyncHandler(async (req, res) => {
    const isTokenValid = Boolean(
      req.adminDoc.checkinToken &&
      req.adminDoc.checkinTokenExpiry &&
      new Date(req.adminDoc.checkinTokenExpiry) > new Date()
    );

    let qrDataUrl = null;
    if (isTokenValid) {
      const payload = JSON.stringify({
        gymId: req.adminDoc._id.toString(),
        gymName: req.adminDoc.gymName,
        token: req.adminDoc.checkinToken,
        expiresAt: req.adminDoc.checkinTokenExpiry,
      });
      qrDataUrl = await qrcode.toDataURL(payload, { width: 320, margin: 2 });
    }

    res.json({
      checkinTokenRequired: !!req.adminDoc.checkinTokenRequired,
      checkinToken: req.adminDoc.checkinToken || '',
      checkinTokenExpiry: req.adminDoc.checkinTokenExpiry,
      isTokenValid,
      qrDataUrl,
    });
  })
);

router.post(
  '/checkin-qr',
  asyncHandler(async (req, res) => {
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiration

    req.adminDoc.checkinToken = token;
    req.adminDoc.checkinTokenExpiry = expiresAt;
    await req.adminDoc.save();

    const payload = JSON.stringify({
      gymId: req.adminDoc._id.toString(),
      gymName: req.adminDoc.gymName,
      token,
      expiresAt,
    });

    const qrDataUrl = await qrcode.toDataURL(payload, { width: 320, margin: 2 });

    res.json({
      message: 'New QR check-in token generated.',
      token,
      expiresAt,
      qrDataUrl,
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

// GET /api/admin/customers?status=active|inactive|overdue&search=jane
router.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const query = { admin: req.adminId };
    // BUG #8 FIX: Use 'inactive' (not 'expired') to be consistent with the UI label
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
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
    const { username, password, name, phone, email, planId } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ message: 'username, password and name are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'That username is already taken.' });

    const recipientEmail = (email || (username.includes('@') ? username : '')).trim().toLowerCase() || null;
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      username: username.trim().toLowerCase(),
      email: recipientEmail,
      passwordHash,
      role: 'customer',
    });

    const customer = await Customer.create({
      user: user._id,
      admin: req.adminId,
      name,
      phone: phone || '',
      plan: planId || null,
    });
    await Streak.create({ customer: customer._id });

    if (recipientEmail) {
      sendEmail({
        to: recipientEmail,
        subject: `Welcome to ${req.adminDoc?.gymName || 'Ironline Gym'}!`,
        html: welcomeEmail(name, req.adminDoc?.gymName, user.username),
      }).catch((err) => console.error('[mailer] Welcome email failed:', err.message));
    }

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
          `Total Records: ${fees.length}  |  Collected: $${totalPaid.toFixed(2)}  |  Pending/Overdue: $${totalUnpaid.toFixed(2)}`
        );
      doc.moveDown(0.8);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151');
      doc.text('Receipt #', 40, tableTop, { width: 90 });
      doc.text('Customer', 130, tableTop, { width: 120 });
      doc.text('Amount', 250, tableTop, { width: 60 });
      doc.text('Status', 315, tableTop, { width: 60 });
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
        doc.text(`$${f.amount.toFixed(2)}`, 250, y, { width: 60 });
        doc.text(f.status.toUpperCase(), 315, y, { width: 60 });
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
    const headers = ['Receipt Number', 'Customer Name', 'Phone', 'Amount', 'Status', 'Due Date', 'Paid On'];
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
      // BUG #5 FIX: Use if/else so only one branch executes — the previous
      // code used two separate if-blocks which was correct by accident but
      // fragile and confusing to read.
      if (status === 'paid') {
        fee.paidOn = new Date();
        fee.receiptNumber = fee.receiptNumber || `RCPT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      } else {
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
  asyncHandler(async (req, res) => {
    const { username, password, name, phone, specialty, bio, assignedCustomers } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ message: 'Username, password and name are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'That username is already taken.' });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      username: username.trim().toLowerCase(),
      email: username.includes('@') ? username.trim().toLowerCase() : undefined,
      passwordHash,
      role: 'trainer',
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

    res.status(201).json(populated);
  })
);

router.put(
  '/trainers/:id',
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
