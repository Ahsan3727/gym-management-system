const express = require('express');
const User = require('../models/User');
const Admin = require('../models/Admin');
const GymBillingFee = require('../models/GymBillingFee');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { attachAdminTenant } = require('../middleware/tenant');
const { validate } = require('../middleware/validate');
const { sendEmail } = require('../utils/mailer');
const {
  createGymFeeSchema,
  bulkGenerateGymFeesSchema,
  markFeePaidSchema,
  submitPaymentProofSchema,
  updateGymFeeSchema,
} = require('../schemas/gymBillingSchemas');

const router = express.Router();

function buildBankInstructions(settings) {
  const parts = [];
  if (settings.bankName) parts.push(`Bank: ${settings.bankName}`);
  if (settings.accountTitle) parts.push(`Account Title: ${settings.accountTitle}`);
  if (settings.accountNumber) parts.push(`Account No: ${settings.accountNumber}`);
  if (settings.iban) parts.push(`IBAN: ${settings.iban}`);
  if (settings.jazzcashNumber) parts.push(`JazzCash: ${settings.jazzcashNumber}`);
  if (settings.easypaisaNumber) parts.push(`EasyPaisa: ${settings.easypaisaNumber}`);
  if (settings.platformBillingNote) parts.push(`Note: ${settings.platformBillingNote}`);
  return parts.join('\n');
}

function logAction(req, action, targetType, targetId, metadata = {}) {
  return AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.role,
    action,
    targetType,
    targetId,
    metadata,
  }).catch((err) => console.error('[audit-log] Failed to log action:', err.message));
}

/* ========================================================================== */
/*                       SUPER ADMIN PLATFORM BILLING                         */
/* ========================================================================== */

// 1. Create a single gym platform fee manually
router.post(
  '/superadmin/gym-fees',
  protect,
  authorize('super_admin'),
  validate(createGymFeeSchema),
  asyncHandler(async (req, res) => {
    const {
      adminId,
      title,
      feeType,
      billingCycle,
      amount,
      dueDate,
      paymentInstructions,
      notes,
      status,
      paymentMethod,
      transactionReference,
    } = req.body;

    const admin = await Admin.findById(adminId).populate('user', 'username email');
    if (!admin) return res.status(404).json({ message: 'Gym not found.' });

    const settings = await Settings.getSingleton();
    const finalInstructions = paymentInstructions || buildBankInstructions(settings);
    const invoiceNumber = await GymBillingFee.generateInvoiceNumber();

    const isPaid = status === 'paid';
    const fee = await GymBillingFee.create({
      admin: admin._id,
      invoiceNumber,
      title,
      feeType,
      billingCycle: billingCycle || `${new Date(dueDate).toLocaleString('en-US', { month: 'short', year: 'numeric' })}`,
      amount,
      dueDate: new Date(dueDate),
      status: isPaid ? 'paid' : 'unpaid',
      paymentMethod: isPaid ? paymentMethod || 'cash' : null,
      paidOn: isPaid ? new Date() : null,
      transactionReference: isPaid ? transactionReference || '' : '',
      paymentInstructions: finalInstructions,
      notes,
      createdBy: req.user._id,
    });

    await logAction(req, 'gym_fee.create', 'GymBillingFee', fee._id, {
      gymName: admin.gymName,
      invoiceNumber,
      amount,
    });

    // Notify gym admin
    if (admin.user?._id) {
      await Notification.create({
        user: admin.user._id,
        type: 'platform_fee_due',
        message: `A new platform invoice (${invoiceNumber} - ${title}) for Rs. ${amount.toLocaleString()} has been issued. Due date: ${new Date(dueDate).toLocaleDateString()}.`,
      }).catch((e) => console.error('[notify-err]', e.message));
    }

    res.status(201).json(fee);
  })
);

// 2. Bulk generate monthly subscription fees for all active gyms
router.post(
  '/superadmin/gym-fees/bulk',
  protect,
  authorize('super_admin'),
  validate(bulkGenerateGymFeesSchema),
  asyncHandler(async (req, res) => {
    const { billingCycle, dueDate, title, defaultAmount } = req.body;

    const [activeGyms, settings] = await Promise.all([
      Admin.find({ isSuspended: false }).populate('user', 'username email'),
      Settings.getSingleton(),
    ]);

    const bankInstructions = buildBankInstructions(settings);
    let createdCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const gym of activeGyms) {
      try {
        // Check if an invoice for this gym & billingCycle already exists
        const existing = await GymBillingFee.findOne({
          admin: gym._id,
          billingCycle,
          feeType: 'subscription',
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        const feeAmount =
          gym.customMonthlyFee != null
            ? gym.customMonthlyFee
            : defaultAmount != null
            ? defaultAmount
            : settings.defaultMonthlyFee || 5000;

        const invoiceNumber = await GymBillingFee.generateInvoiceNumber();
        const invoiceTitle = title || `Monthly Platform Subscription — ${billingCycle}`;

        await GymBillingFee.create({
          admin: gym._id,
          invoiceNumber,
          title: invoiceTitle,
          feeType: 'subscription',
          billingCycle,
          amount: feeAmount,
          dueDate: new Date(dueDate),
          status: 'unpaid',
          paymentInstructions: bankInstructions,
          createdBy: req.user._id,
        });

        createdCount++;

        // Notify gym
        if (gym.user?._id) {
          Notification.create({
            user: gym.user._id,
            type: 'platform_fee_due',
            message: `Your monthly platform subscription invoice for ${billingCycle} (Rs. ${feeAmount.toLocaleString()}) has been generated. Due by ${new Date(dueDate).toLocaleDateString()}.`,
          }).catch(() => {});
        }
      } catch (err) {
        errors.push({ gymName: gym.gymName, error: err.message });
      }
    }

    await logAction(req, 'gym_fee.bulk_generate', 'GymBillingFee', null, {
      billingCycle,
      createdCount,
      skippedCount,
    });

    res.json({
      message: `Bulk invoicing complete: ${createdCount} generated, ${skippedCount} skipped (already invoiced).`,
      createdCount,
      skippedCount,
      errors,
    });
  })
);

// 3. List platform fees with filters (adminId, status, search)
router.get(
  '/superadmin/gym-fees',
  protect,
  authorize('super_admin'),
  asyncHandler(async (req, res) => {
    const { adminId, status, search } = req.query;
    const filter = {};

    if (adminId) filter.admin = adminId;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const fees = await GymBillingFee.find(filter)
      .populate('admin', 'gymName slug contact address user')
      .sort({ created_at: -1 })
      .lean();

    res.json(fees);
  })
);

// 4. Platform billing analytics & KPI totals
router.get(
  '/superadmin/gym-fees/stats',
  protect,
  authorize('super_admin'),
  asyncHandler(async (req, res) => {
    const [totals, awaitingProofCount, overdueCount, recentPaid] = await Promise.all([
      GymBillingFee.aggregate([
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      GymBillingFee.countDocuments({
        status: 'unpaid',
        'paymentProof.reference': { $ne: '' },
      }),
      GymBillingFee.countDocuments({ status: 'overdue' }),
      GymBillingFee.aggregate([
        { $match: { status: 'paid', paidOn: { $ne: null } } },
        {
          $group: {
            _id: {
              year: { $year: '$paidOn' },
              month: { $month: '$paidOn' },
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 },
      ]),
    ]);

    const statusMap = Object.fromEntries(totals.map((t) => [t._id, t]));

    res.json({
      totalPaidRevenue: statusMap.paid?.totalAmount || 0,
      paidCount: statusMap.paid?.count || 0,
      totalUnpaidAmount: (statusMap.unpaid?.totalAmount || 0) + (statusMap.overdue?.totalAmount || 0),
      unpaidCount: statusMap.unpaid?.count || 0,
      overdueCount,
      awaitingProofCount,
      recentMonthlyRevenue: recentPaid,
    });
  })
);

// 5. Get single fee details
router.get(
  '/superadmin/gym-fees/:id',
  protect,
  authorize('super_admin'),
  asyncHandler(async (req, res) => {
    const fee = await GymBillingFee.findById(req.params.id)
      .populate('admin', 'gymName slug contact address user customMonthlyFee')
      .populate('createdBy', 'username');
    if (!fee) return res.status(404).json({ message: 'Platform invoice not found.' });
    res.json(fee);
  })
);

// 6. Update single fee
router.put(
  '/superadmin/gym-fees/:id',
  protect,
  authorize('super_admin'),
  validate(updateGymFeeSchema),
  asyncHandler(async (req, res) => {
    const fee = await GymBillingFee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Invoice not found.' });

    const { title, feeType, billingCycle, amount, dueDate, paymentInstructions, notes } = req.body;
    if (title !== undefined) fee.title = title;
    if (feeType !== undefined) fee.feeType = feeType;
    if (billingCycle !== undefined) fee.billingCycle = billingCycle;
    if (amount !== undefined) fee.amount = amount;
    if (dueDate !== undefined) fee.dueDate = new Date(dueDate);
    if (paymentInstructions !== undefined) fee.paymentInstructions = paymentInstructions;
    if (notes !== undefined) fee.notes = notes;

    await fee.save();
    await logAction(req, 'gym_fee.update', 'GymBillingFee', fee._id);
    res.json(fee);
  })
);

// 7. Mark fee as paid
router.put(
  '/superadmin/gym-fees/:id/mark-paid',
  protect,
  authorize('super_admin'),
  validate(markFeePaidSchema),
  asyncHandler(async (req, res) => {
    const fee = await GymBillingFee.findById(req.params.id).populate('admin');
    if (!fee) return res.status(404).json({ message: 'Invoice not found.' });

    const { paymentMethod, paidOn, transactionReference, notes } = req.body;
    fee.status = 'paid';
    fee.paymentMethod = paymentMethod;
    fee.paidOn = paidOn ? new Date(paidOn) : new Date();
    if (transactionReference !== undefined) fee.transactionReference = transactionReference;
    if (notes) fee.notes = fee.notes ? `${fee.notes}\n${notes}` : notes;

    await fee.save();
    await logAction(req, 'gym_fee.mark_paid', 'GymBillingFee', fee._id, {
      invoiceNumber: fee.invoiceNumber,
      amount: fee.amount,
      paymentMethod,
    });

    // Notify gym admin
    if (fee.admin?.user) {
      await Notification.create({
        user: fee.admin.user,
        type: 'admin_alert',
        message: `Your payment of Rs. ${fee.amount.toLocaleString()} for ${fee.invoiceNumber} (${fee.title}) has been verified and marked Paid. Thank you!`,
      }).catch(() => {});
    }

    res.json(fee);
  })
);

// 8. Waive fee
router.put(
  '/superadmin/gym-fees/:id/waive',
  protect,
  authorize('super_admin'),
  asyncHandler(async (req, res) => {
    const fee = await GymBillingFee.findById(req.params.id).populate('admin');
    if (!fee) return res.status(404).json({ message: 'Invoice not found.' });

    fee.status = 'waived';
    fee.notes = fee.notes ? `${fee.notes}\n[Fee waived by Super Admin]` : '[Fee waived by Super Admin]';
    await fee.save();

    await logAction(req, 'gym_fee.waive', 'GymBillingFee', fee._id);

    if (fee.admin?.user) {
      await Notification.create({
        user: fee.admin.user,
        type: 'admin_alert',
        message: `Invoice ${fee.invoiceNumber} (${fee.title}) has been waived by platform administration.`,
      }).catch(() => {});
    }

    res.json(fee);
  })
);

// 9. Delete fee
router.delete(
  '/superadmin/gym-fees/:id',
  protect,
  authorize('super_admin'),
  asyncHandler(async (req, res) => {
    const fee = await GymBillingFee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Invoice not found.' });

    await fee.deleteOne();
    await logAction(req, 'gym_fee.delete', 'GymBillingFee', req.params.id, {
      invoiceNumber: fee.invoiceNumber,
    });

    res.json({ message: 'Invoice removed successfully.' });
  })
);

// 10. Send reminder for unpaid/overdue fee
router.post(
  '/superadmin/gym-fees/:id/remind',
  protect,
  authorize('super_admin'),
  asyncHandler(async (req, res) => {
    const fee = await GymBillingFee.findById(req.params.id).populate({
      path: 'admin',
      populate: { path: 'user', select: 'username email' },
    });
    if (!fee) return res.status(404).json({ message: 'Invoice not found.' });

    const user = fee.admin?.user;
    if (!user) return res.status(400).json({ message: 'Gym account has no associated user.' });

    // In-app notification
    await Notification.create({
      user: user._id,
      type: 'platform_fee_due',
      message: `Payment Reminder: Invoice ${fee.invoiceNumber} (Rs. ${fee.amount.toLocaleString()}) was due on ${fee.dueDate.toISOString().split('T')[0]}. Please submit payment to avoid service restriction.`,
    });

    // Email notification if email exists
    let emailSent = false;
    const recipientEmail = user.email || (user.username?.includes('@') ? user.username : null);
    if (recipientEmail) {
      const mailRes = await sendEmail({
        to: recipientEmail,
        subject: `Platform Subscription Reminder — ${fee.invoiceNumber}`,
        html: `<p>Dear ${fee.admin.gymName},</p><p>This is a reminder regarding your platform subscription invoice <strong>${fee.invoiceNumber}</strong> for <strong>Rs. ${fee.amount.toLocaleString()}</strong>.</p><p>Due Date: <strong>${fee.dueDate.toISOString().split('T')[0]}</strong></p><p>Please log in to your gym admin portal and navigate to <strong>Platform Dues</strong> to view payment details or submit your payment proof.</p>`,
      });
      emailSent = !!mailRes.success;
    }

    res.json({ message: `Reminder dispatched to ${fee.admin.gymName} (Email sent: ${emailSent}).` });
  })
);

/* ========================================================================== */
/*                       GYM ADMIN (TENANT) BILLING                           */
/* ========================================================================== */

// 1. List fees for the logged-in gym
router.get(
  '/admin/platform-fees',
  protect,
  authorize('admin'),
  attachAdminTenant,
  asyncHandler(async (req, res) => {
    const fees = await GymBillingFee.find({ admin: req.adminId })
      .sort({ created_at: -1 })
      .lean();
    res.json(fees);
  })
);

// 2. Gym billing summary (outstanding balance, severe overdue status, bank info)
router.get(
  '/admin/platform-fees/summary',
  protect,
  authorize('admin'),
  attachAdminTenant,
  asyncHandler(async (req, res) => {
    const [fees, settings] = await Promise.all([
      GymBillingFee.find({ admin: req.adminId }).lean(),
      Settings.getSingleton(),
    ]);

    const unpaidFees = fees.filter((f) => f.status === 'unpaid' || f.status === 'overdue');
    const totalOutstanding = unpaidFees.reduce((sum, f) => sum + f.amount, 0);

    const now = new Date();
    const graceDays = settings.gracePeriodDays ?? 14;
    const overdueFees = unpaidFees.filter((f) => new Date(f.dueDate) < now);

    // Severe restriction: if any overdue fee's due date is older than gracePeriodDays
    const severeOverdue = overdueFees.some((f) => {
      const graceLimit = new Date(f.dueDate);
      graceLimit.setDate(graceLimit.getDate() + graceDays);
      return now > graceLimit;
    });

    res.json({
      totalOutstanding,
      unpaidCount: unpaidFees.length,
      overdueCount: overdueFees.length,
      isSeverelyOverdue: severeOverdue,
      gracePeriodDays: graceDays,
      bankDetails: {
        bankName: settings.bankName || '',
        accountTitle: settings.accountTitle || '',
        accountNumber: settings.accountNumber || '',
        iban: settings.iban || '',
        jazzcashNumber: settings.jazzcashNumber || '',
        easypaisaNumber: settings.easypaisaNumber || '',
        note: settings.platformBillingNote || '',
      },
    });
  })
);

// 3. Gym owner submits payment proof / reference
router.post(
  '/admin/platform-fees/:id/submit-proof',
  protect,
  authorize('admin'),
  attachAdminTenant,
  validate(submitPaymentProofSchema),
  asyncHandler(async (req, res) => {
    const fee = await GymBillingFee.findOne({
      _id: req.params.id,
      admin: req.adminId,
    });

    if (!fee) return res.status(404).json({ message: 'Invoice not found.' });
    if (fee.status === 'paid') {
      return res.status(400).json({ message: 'This invoice is already marked as paid.' });
    }

    const { paymentMethod, reference, bankName, note } = req.body;
    fee.paymentMethod = paymentMethod;
    fee.paymentProof = {
      reference,
      bankName: bankName || '',
      note: note || '',
      submittedAt: new Date(),
    };

    await fee.save();

    await logAction(req, 'gym_fee.submit_proof', 'GymBillingFee', fee._id, {
      invoiceNumber: fee.invoiceNumber,
      reference,
    });

    res.json({
      message: 'Payment reference submitted successfully. Super admin will verify and mark as paid.',
      fee,
    });
  })
);

module.exports = router;
