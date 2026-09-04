const express = require('express');
const Customer = require('../models/Customer');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const WeightLog = require('../models/WeightLog');
const Streak = require('../models/Streak');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { attachTrainerTenant } = require('../middleware/tenant');

const router = express.Router();

// Guard all trainer routes: Must be logged in, role=trainer, and attached to active gym
router.use(protect, authorize('trainer'), attachTrainerTenant);

/**
 * GET /api/trainer/profile
 * Returns trainer document and gym info
 */
router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    res.json({
      trainer: req.trainerDoc,
      gym: {
        id: req.adminDoc._id,
        gymName: req.adminDoc.gymName,
        gymLogoUrl: req.adminDoc.gymLogoUrl,
      },
    });
  })
);

/**
 * GET /api/trainer/clients
 * Returns all assigned clients for this trainer, with membership plan and streak
 */
router.get(
  '/clients',
  asyncHandler(async (req, res) => {
    const assignedIds = req.trainerDoc.assignedCustomers || [];
    const customers = await Customer.find({
      _id: { $in: assignedIds },
      admin: req.adminId,
      isActive: true,
    }).populate('plan', 'planName durationMonths');

    // Enrich each customer with their streak
    const enriched = await Promise.all(
      customers.map(async (c) => {
        const streak = await Streak.findOne({ customer: c._id });
        const lastWorkout = await WorkoutLog.findOne({ customer: c._id }).sort({ date: -1 });
        return {
          ...c.toObject(),
          streak: streak ? streak.currentStreak : 0,
          lastWorkoutDate: lastWorkout ? lastWorkout.date : null,
        };
      })
    );

    res.json(enriched);
  })
);

/**
 * Helper to ensure the target customer is assigned to this trainer
 */
function assertClientAssigned(trainerDoc, customerId) {
  const isAssigned = (trainerDoc.assignedCustomers || []).some(
    (id) => id.toString() === customerId.toString()
  );
  if (!isAssigned) {
    const err = new Error('This client is not assigned to your trainer account.');
    err.statusCode = 403;
    throw err;
  }
}

/**
 * GET /api/trainer/clients/:id/progress
 * Progress metrics: workouts, nutrition, weight trend, streak
 */
router.get(
  '/clients/:id/progress',
  asyncHandler(async (req, res) => {
    assertClientAssigned(req.trainerDoc, req.params.id);

    const customer = await Customer.findOne({ _id: req.params.id, admin: req.adminId }).populate('plan');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    const [workouts, diet, weight, streak] = await Promise.all([
      WorkoutLog.find({ customer: customer._id }).sort({ date: -1 }).limit(30),
      DietLog.find({ customer: customer._id }).sort({ date: -1 }).limit(30),
      WeightLog.find({ customer: customer._id }).sort({ date: -1 }).limit(30),
      Streak.findOne({ customer: customer._id }),
    ]);

    res.json({
      customer,
      workouts,
      diet,
      weight,
      streak,
    });
  })
);

/**
 * POST /api/trainer/clients/:id/workouts
 * Prescribes / logs a workout for an assigned client
 */
router.post(
  '/clients/:id/workouts',
  asyncHandler(async (req, res) => {
    assertClientAssigned(req.trainerDoc, req.params.id);

    const { exercise, sets, reps, weight, durationMinutes, isRestDay, notes, date } = req.body;
    if (!isRestDay && !exercise) {
      return res.status(400).json({ message: 'Exercise name is required.' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const workout = await WorkoutLog.create({
      customer: customer._id,
      exercise: isRestDay ? 'Rest Day' : exercise.trim(),
      sets: sets ? Number(sets) : null,
      reps: reps ? Number(reps) : null,
      weight: weight ? Number(weight) : null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      isRestDay: !!isRestDay,
      notes: notes ? `[Coach ${req.trainerDoc.name}]: ${notes}` : `Prescribed by Coach ${req.trainerDoc.name}`,
      date: date ? new Date(date) : new Date(),
    });

    // Notify the member
    if (customer.user) {
      await Notification.create({
        user: customer.user,
        type: 'general',
        message: `Coach ${req.trainerDoc.name} added a workout plan: ${workout.exercise}`,
      });
    }

    res.status(201).json(workout);
  })
);

/**
 * POST /api/trainer/clients/:id/diet
 * Prescribes / logs a meal plan for an assigned client
 */
router.post(
  '/clients/:id/diet',
  asyncHandler(async (req, res) => {
    assertClientAssigned(req.trainerDoc, req.params.id);

    const { meal, calories, proteinG, carbsG, fatG, date } = req.body;
    if (!meal) {
      return res.status(400).json({ message: 'Meal description is required.' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const diet = await DietLog.create({
      customer: customer._id,
      meal: meal.trim(),
      calories: calories ? Number(calories) : null,
      macros: {
        proteinG: proteinG ? Number(proteinG) : null,
        carbsG: carbsG ? Number(carbsG) : null,
        fatG: fatG ? Number(fatG) : null,
      },
      date: date ? new Date(date) : new Date(),
    });

    // Notify the member
    if (customer.user) {
      await Notification.create({
        user: customer.user,
        type: 'general',
        message: `Coach ${req.trainerDoc.name} added a nutrition plan: ${diet.meal}`,
      });
    }

    res.status(201).json(diet);
  })
);

module.exports = router;
