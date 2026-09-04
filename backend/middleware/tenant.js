const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Trainer = require('../models/Trainer');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Resolves the calling admin's own Admin document and attaches
 * req.adminDoc / req.adminId. This is the ONLY place adminId is derived
 * for an admin request - route handlers must use req.adminId to filter
 * every query, never a value taken from the request body or params.
 * Use after protect() + authorize('admin').
 */
const attachAdminTenant = asyncHandler(async (req, res, next) => {
  const adminDoc = await Admin.findOne({ user: req.user._id });
  if (!adminDoc) {
    return res.status(403).json({ message: 'No gym profile is associated with this account.' });
  }
  if (adminDoc.isSuspended) {
    return res.status(403).json({ message: 'This gym account has been suspended.' });
  }
  req.adminDoc = adminDoc;
  req.adminId = adminDoc._id;
  next();
});

/**
 * Resolves the calling customer's own Customer document and attaches
 * req.customerDoc / req.customerId / req.adminId (their gym's tenant id).
 * Use after protect() + authorize('customer').
 */
const attachCustomerTenant = asyncHandler(async (req, res, next) => {
  const customerDoc = await Customer.findOne({ user: req.user._id });
  if (!customerDoc) {
    return res.status(403).json({ message: 'No customer profile is associated with this account.' });
  }
  req.customerDoc = customerDoc;
  req.customerId = customerDoc._id;
  req.adminId = customerDoc.admin;
  next();
});

/**
 * Resolves the calling trainer's own Trainer document and attaches
 * req.trainerDoc / req.trainerId / req.adminId.
 * Use after protect() + authorize('trainer').
 */
const attachTrainerTenant = asyncHandler(async (req, res, next) => {
  const trainerDoc = await Trainer.findOne({ user: req.user._id });
  if (!trainerDoc || !trainerDoc.isActive) {
    return res.status(403).json({ message: 'No active trainer profile is associated with this account.' });
  }
  const adminDoc = await Admin.findById(trainerDoc.admin);
  if (!adminDoc || adminDoc.isSuspended) {
    return res.status(403).json({ message: 'This gym account has been suspended.' });
  }
  req.trainerDoc = trainerDoc;
  req.trainerId = trainerDoc._id;
  req.adminId = trainerDoc.admin;
  req.adminDoc = adminDoc;
  next();
});

module.exports = { attachAdminTenant, attachCustomerTenant, attachTrainerTenant };
