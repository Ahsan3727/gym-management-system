const express = require('express');

const Fee = require('../models/Fee');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const WeightLog = require('../models/WeightLog');
const Streak = require('../models/Streak');
const Notification = require('../models/Notification');
const Admin = require('../models/Admin');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
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
// Extracted into a named handler so both /streak/checkin and the /checkin
// alias call the same function directly — no fragile req.url mutation needed.
async function handleCheckin(req, res) {
  const { qrToken, offlineScannedAt } = req.body || {};

  // Validate offline sync timestamp if provided
  let scanDate = null;
  if (offlineScannedAt) {
    scanDate = new Date(offlineScannedAt);
    if (isNaN(scanDate.getTime()) || scanDate > new Date()) {
      return res.status(400).json({ message: 'Invalid offline check-in timestamp.' });
    }
    const ageHours = (Date.now() - scanDate.getTime()) / (1000 * 60 * 60);
    if (ageHours > 36) {
      return res.status(400).json({ message: 'Offline check-in has expired (must be synced within 24–36 hours).' });
    }
  }

  // If gym requires physical QR token, validate token and expiry
  const admin = await Admin.findById(req.adminId);
  if (admin?.checkinTokenRequired) {
    let token = (qrToken || '').trim();

    // Extract token if user pasted full URL (e.g. https://domain.com/customer/checkin?token=XYZ)
    if (token.includes('token=')) {
      try {
        const u = new URL(token, 'http://localhost');
        token = u.searchParams.get('token') || token;
      } catch {
        // fallback regex extract
        const match = token.match(/token=([a-zA-Z0-9_-]+)/);
        if (match) token = match[1];
      }
    }

    // Extract token if raw JSON string
    if (token && token.startsWith('{')) {
      try {
        const parsed = JSON.parse(token);
        token = parsed.token || token;
      } catch {
        // ignore json parse error
      }
    }

    if (!token) {
      return res.status(400).json({
        message: 'QR check-in verification is required by your gym. Please scan the QR code at reception.',
      });
    }

    const isExpired = !admin.checkinTokenExpiry || new Date() > new Date(admin.checkinTokenExpiry);
    if (token !== admin.checkinToken || (isExpired && !offlineScannedAt)) {
      return res.status(400).json({
        message: 'Invalid or expired QR check-in token. Please scan the latest code at reception.',
      });
    }
  }

  let streak = await Streak.findOne({ customer: req.customerId });
  if (!streak) streak = new Streak({ customer: req.customerId });

  const effectiveDate = scanDate || new Date();
  const today = new Date(effectiveDate);
  today.setUTCHours(0, 0, 0, 0);

  let restDayApplied = false;

  if (streak.lastCheckin) {
    const last = new Date(streak.lastCheckin);
    last.setUTCHours(0, 0, 0, 0);
    const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return res.json(streak); // already checked in today
    }

    if (diffDays === 1) {
      // Consecutive day: standard streak increment
      streak.currentStreak += 1;
    } else if (diffDays === 2) {
      // 1 day was missed (e.g. Sunday rest day).
      // Check if 1-day-per-week rest day allowance is available (not used in last 7 days):
      const daysSinceLastRest = streak.lastRestDayUsed
        ? Math.round((today - new Date(streak.lastRestDayUsed)) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceLastRest >= 7) {
        // 1 rest day per week allowed! Streak is preserved and continues!
        streak.currentStreak += 1;
        streak.lastRestDayUsed = today;
        streak.restDaysUsed = (streak.restDaysUsed || 0) + 1;
        restDayApplied = true;
      } else {
        // Already took a rest day within this 7-day window -> streak resets
        streak.currentStreak = 1;
      }
    } else {
      // 2 or more consecutive missed days -> streak resets
      streak.currentStreak = 1;
    }
  } else {
    streak.currentStreak = 1;
  }

  streak.lastCheckin = today;
  streak.totalCheckins = (streak.totalCheckins || 0) + 1;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

  const milestones = [7, 30, 100, 365];
  milestones.forEach((m) => {
    const badge = `${m}-day-streak`;
    if (streak.currentStreak >= m && !streak.badges.includes(badge)) {
      streak.badges.push(badge);
    }
  });

  const attendanceMethod = offlineScannedAt ? 'qr_offline_sync' : 'qr';

  await Promise.all([
    streak.save(),
    Attendance.create({
      customer: req.customerId,
      admin: req.adminId,
      checkedInAt: effectiveDate,
      method: attendanceMethod,
      notes: restDayApplied ? 'Weekly rest day protected streak' : '',
    }),
  ]);

  const responseData = streak.toObject();
  responseData.restDayApplied = restDayApplied;
  res.json(responseData);
}

// One check-in per day. Extends the streak if yesterday's check-in exists,
// resets to 1 if there was a gap, no-ops if already checked in today.
router.post('/streak/checkin', asyncHandler(handleCheckin));

// POST /api/customer/checkin — alias pointing at the same handler directly
router.post('/checkin', asyncHandler(handleCheckin));


/* -------------------------------- Analytics --------------------------------- */

// Aggregated series for the dashboard charts: weight over time, workout
// consistency (sessions per day over last 30 days), calorie trend.
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const daysNum = Math.min(365, Math.max(1, parseInt(req.query.days || '30', 10)));
    const cutoffDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const [weight, workouts, diet] = await Promise.all([
      WeightLog.find({ customer: req.customerId, date: { $gte: cutoffDate } }).sort({ date: 1 }).select('weightKg date'),
      WorkoutLog.find({ customer: req.customerId, date: { $gte: cutoffDate }, isRestDay: false }).select('date'),
      DietLog.find({ customer: req.customerId, date: { $gte: cutoffDate } }).select('calories date'),
    ]);

    res.json({ weight, workouts, diet });
  })
);

/* -------------------------------- Sessions ---------------------------------- */

// GET /api/customer/sessions
// List scheduled and past personal training sessions for this customer
router.get(
  '/sessions',
  asyncHandler(async (req, res) => {
    const sessions = await Session.find({ customer: req.customerId, admin: req.adminId })
      .populate('trainer', 'name phone specialty')
      .sort({ scheduledAt: 1 });
    res.json(sessions);
  })
);

module.exports = router;
