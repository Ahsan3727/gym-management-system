const express = require('express');

const Fee = require('../models/Fee');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const WeightLog = require('../models/WeightLog');
const Streak = require('../models/Streak');
const Notification = require('../models/Notification');
const Admin = require('../models/Admin');
const stripeUtil = require('../utils/stripe');

const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { attachCustomerTenant } = require('../middleware/tenant');

const router = express.Router();

// Every route below belongs to the logged-in customer only (req.customerId).
router.use(protect, authorize('customer'), attachCustomerTenant);

/* --------------------------------- Profile --------------------------------- */

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    await req.customerDoc.populate('plan');
    const admin = await Admin.findById(req.adminId).select('gymName gymLogoUrl checkinTokenRequired');
    res.json({
      ...req.customerDoc.toObject(),
      gym: admin,
    });
  })
);

router.put(
  '/profile',
  asyncHandler(async (req, res) => {
    const { phone, goals, notificationPrefs } = req.body;
    if (phone !== undefined) req.customerDoc.phone = phone;
    if (goals !== undefined) req.customerDoc.goals = goals;
    if (notificationPrefs !== undefined) {
      req.customerDoc.notificationPrefs = { ...req.customerDoc.notificationPrefs, ...notificationPrefs };
    }
    await req.customerDoc.save();
    res.json(req.customerDoc);
  })
);

// Read-only fee status + membership/renewal info.
router.get(
  '/fees',
  asyncHandler(async (req, res) => {
    const fees = await Fee.find({ customer: req.customerId }).sort({ dueDate: -1 });
    res.json(fees);
  })
);

router.post(
  '/fees/:id/pay',
  asyncHandler(async (req, res) => {
    const fee = await Fee.findOne({ _id: req.params.id, customer: req.customerId });
    if (!fee) return res.status(404).json({ message: 'Fee record not found.' });

    if (fee.status === 'paid') {
      return res.status(400).json({ message: 'This fee is already paid.' });
    }

    const gym = await Admin.findById(req.adminId);
    await req.customerDoc.populate('user');

    const session = await stripeUtil.createFeeCheckoutSession({
      fee,
      customer: req.customerDoc,
      gym,
      originUrl: req.headers.origin,
    });

    res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      isSimulated: !!session.isSimulated,
    });
  })
);

router.get(
  '/membership',
  asyncHandler(async (req, res) => {
    await req.customerDoc.populate('plan');
    const nextDue = await Fee.findOne({ customer: req.customerId, status: { $ne: 'paid' } }).sort({ dueDate: 1 });
    res.json({ plan: req.customerDoc.plan, joinDate: req.customerDoc.joinDate, nextDue });
  })
);

router.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id }).sort({ sentAt: -1 }).limit(50);
    res.json(notifications);
  })
);

router.patch(
  '/notifications/read-all',
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { user: req.user._id, readAt: null },
      { readAt: new Date() }
    );
    res.json({ message: 'All marked as read' });
  })
);

router.patch(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { readAt: new Date() },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json(notif);
  })
);

/* --------------------------------- Workouts -------------------------------- */

router.get(
  '/workouts',
  asyncHandler(async (req, res) => {
    const logs = await WorkoutLog.find({ customer: req.customerId }).sort({ date: -1 }).limit(200);
    res.json(logs);
  })
);

router.post(
  '/workouts',
  asyncHandler(async (req, res) => {
    const { exercise, sets, reps, weight, durationMinutes, isRestDay, notes, date } = req.body;
    if (!isRestDay && !exercise) {
      return res.status(400).json({ message: 'exercise is required unless logging a rest day.' });
    }
    const log = await WorkoutLog.create({
      customer: req.customerId,
      exercise: exercise || 'Rest day',
      sets,
      reps,
      weight,
      durationMinutes,
      isRestDay: !!isRestDay,
      notes,
      date: date || Date.now(),
    });
    res.status(201).json(log);
  })
);

// BUG #3 FIX: Whitelist only the allowed fields — no longer uses Object.assign(log, req.body)
// which would let a user overwrite protected fields like `customer` or `_id`.
router.put(
  '/workouts/:id',
  asyncHandler(async (req, res) => {
    const log = await WorkoutLog.findOne({ _id: req.params.id, customer: req.customerId });
    if (!log) return res.status(404).json({ message: 'Log not found.' });
    const { exercise, sets, reps, weight, durationMinutes, isRestDay, notes, date } = req.body;
    if (exercise !== undefined) log.exercise = exercise;
    if (sets !== undefined) log.sets = sets;
    if (reps !== undefined) log.reps = reps;
    if (weight !== undefined) log.weight = weight;
    if (durationMinutes !== undefined) log.durationMinutes = durationMinutes;
    if (isRestDay !== undefined) log.isRestDay = isRestDay;
    if (notes !== undefined) log.notes = notes;
    if (date !== undefined) log.date = date;
    await log.save();
    res.json(log);
  })
);

router.delete(
  '/workouts/:id',
  asyncHandler(async (req, res) => {
    const result = await WorkoutLog.findOneAndDelete({ _id: req.params.id, customer: req.customerId });
    if (!result) return res.status(404).json({ message: 'Log not found.' });
    res.json({ message: 'Deleted.' });
  })
);

/* ---------------------------------- Diet ----------------------------------- */

router.get(
  '/diet',
  asyncHandler(async (req, res) => {
    const logs = await DietLog.find({ customer: req.customerId }).sort({ date: -1 }).limit(200);
    res.json(logs);
  })
);

router.post(
  '/diet',
  asyncHandler(async (req, res) => {
    const { meal, calories, macros, waterMl, date } = req.body;
    if (!meal) return res.status(400).json({ message: 'meal is required.' });
    const log = await DietLog.create({ customer: req.customerId, meal, calories, macros, waterMl, date: date || Date.now() });
    res.status(201).json(log);
  })
);

// BUG #3 FIX: Whitelist only the allowed fields — same mass assignment fix as workouts.
router.put(
  '/diet/:id',
  asyncHandler(async (req, res) => {
    const log = await DietLog.findOne({ _id: req.params.id, customer: req.customerId });
    if (!log) return res.status(404).json({ message: 'Log not found.' });
    const { meal, calories, macros, waterMl, date } = req.body;
    if (meal !== undefined) log.meal = meal;
    if (calories !== undefined) log.calories = calories;
    if (macros !== undefined) log.macros = macros;
    if (waterMl !== undefined) log.waterMl = waterMl;
    if (date !== undefined) log.date = date;
    await log.save();
    res.json(log);
  })
);

router.delete(
  '/diet/:id',
  asyncHandler(async (req, res) => {
    const result = await DietLog.findOneAndDelete({ _id: req.params.id, customer: req.customerId });
    if (!result) return res.status(404).json({ message: 'Log not found.' });
    res.json({ message: 'Deleted.' });
  })
);

/* ------------------------------ Weight & body ------------------------------ */

router.get(
  '/weight',
  asyncHandler(async (req, res) => {
    const logs = await WeightLog.find({ customer: req.customerId }).sort({ date: -1 }).limit(200);
    res.json(logs);
  })
);

router.post(
  '/weight',
  asyncHandler(async (req, res) => {
    const { weightKg, heightCm, measurements, progressPhotoUrl, date } = req.body;
    if (!weightKg) return res.status(400).json({ message: 'weightKg is required.' });
    const log = await WeightLog.create({
      customer: req.customerId,
      weightKg,
      heightCm,
      measurements,
      progressPhotoUrl,
      date: date || Date.now(),
    });
    res.status(201).json(log);
  })
);

router.delete(
  '/weight/:id',
  asyncHandler(async (req, res) => {
    const result = await WeightLog.findOneAndDelete({ _id: req.params.id, customer: req.customerId });
    if (!result) return res.status(404).json({ message: 'Log not found.' });
    res.json({ message: 'Deleted.' });
  })
);

/* ---------------------------------- Streak ---------------------------------- */

router.get(
  '/streak',
  asyncHandler(async (req, res) => {
    const streak = await Streak.findOne({ customer: req.customerId });
    res.json(streak);
  })
);

// One check-in per day. Extends the streak if yesterday's check-in exists,
// resets to 1 if there was a gap, no-ops if already checked in today.
router.post(
  '/streak/checkin',
  asyncHandler(async (req, res) => {
    // If gym requires physical QR token, validate token and expiry
    const admin = await Admin.findById(req.adminId);
    if (admin?.checkinTokenRequired) {
      let token = req.body?.qrToken?.trim();
      if (token && token.startsWith('{')) {
        try {
          const parsed = JSON.parse(token);
          token = parsed.token;
        } catch {
          // ignore json parse error, use raw string
        }
      }

      if (!token) {
        return res.status(400).json({
          message: 'QR check-in verification is required by your gym. Please scan the QR code at reception.',
        });
      }

      const isExpired = !admin.checkinTokenExpiry || new Date() > new Date(admin.checkinTokenExpiry);
      if (token !== admin.checkinToken || isExpired) {
        return res.status(400).json({
          message: 'Invalid or expired QR check-in token. Please scan the latest code at reception.',
        });
      }
    }

    let streak = await Streak.findOne({ customer: req.customerId });
    if (!streak) streak = new Streak({ customer: req.customerId });

    // BUG #16 FIX: Use UTC methods so "today" is consistent regardless of the
    // server's local timezone. Previously setHours(0,0,0,0) used local time
    // which could cause double check-ins or missed streaks near midnight UTC.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (streak.lastCheckin) {
      const last = new Date(streak.lastCheckin);
      last.setUTCHours(0, 0, 0, 0);
      const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return res.json(streak); // already checked in today
      }
      streak.currentStreak = diffDays === 1 ? streak.currentStreak + 1 : 1;
    } else {
      streak.currentStreak = 1;
    }

    streak.lastCheckin = today;
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

    const milestones = [7, 30, 100, 365];
    milestones.forEach((m) => {
      const badge = `${m}-day-streak`;
      if (streak.currentStreak >= m && !streak.badges.includes(badge)) {
        streak.badges.push(badge);
      }
    });

    await streak.save();
    res.json(streak);
  })
);

/* -------------------------------- Analytics --------------------------------- */

// Aggregated series for the dashboard charts: weight over time, workout
// consistency (sessions per day over last 30 days), calorie trend.
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [weight, workouts, diet] = await Promise.all([
      WeightLog.find({ customer: req.customerId, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 }).select('weightKg date'),
      WorkoutLog.find({ customer: req.customerId, date: { $gte: thirtyDaysAgo }, isRestDay: false }).select('date'),
      DietLog.find({ customer: req.customerId, date: { $gte: thirtyDaysAgo } }).select('calories date'),
    ]);

    res.json({ weight, workouts, diet });
  })
);

module.exports = router;
