const express = require('express');
const crypto = require('crypto');
const Fee = require('../models/Fee');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');
const stripeUtil = require('../utils/stripe');
const { sendEmail } = require('../utils/mailer');
const { paymentReceiptEmail } = require('../utils/emailTemplates');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * Shared helper to mark a fee paid, issue receipt, notify customer, and send email receipt.
 */
async function processFeePaymentSuccess(feeId) {
  const fee = await Fee.findById(feeId).populate([
    {
      path: 'customer',
      populate: { path: 'user', select: 'username email isActive' },
    },
    {
      path: 'admin',
      select: 'gymName contactEmail',
    },
  ]);

  if (!fee) return null;

  if (fee.status !== 'paid') {
    fee.status = 'paid';
    fee.paidOn = new Date();
    fee.receiptNumber = fee.receiptNumber || `RCPT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    await fee.save();

    const customer = fee.customer;
    const admin = fee.admin;
    const user = customer?.user;

    // In-app notification
    if (user?._id) {
      try {
        await Notification.create({
          user: user._id,
          type: 'fee_due',
          message: `Your membership fee payment of $${fee.amount.toFixed(2)} was received successfully. Receipt: ${fee.receiptNumber}`,
        });
      } catch (notifyErr) {
        console.error('[stripe-webhook] Notification creation error:', notifyErr.message);
      }

      // Email receipt
      const recipientEmail = user.email || (user.username?.includes('@') ? user.username : null);
      if (recipientEmail) {
        sendEmail({
          to: recipientEmail,
          subject: `Payment Receipt ${fee.receiptNumber} — ${admin?.gymName || 'Ironline Gym'}`,
          html: paymentReceiptEmail(customer.name, fee.amount, fee.receiptNumber, admin?.gymName),
        }).catch((err) => console.error('[stripe-webhook] Receipt email failed:', err.message));
      }
    }
  }

  return fee;
}

/**
 * POST /api/webhooks/stripe
 * Stripe webhooks receiver. Uses raw body buffer for signature verification.
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    let event;
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && stripeUtil.stripe) {
      try {
        event = stripeUtil.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error('[stripe-webhook] Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // In development or when webhook secret is unconfigured
      try {
        event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch {
        event = req.body;
      }
    }

    if (event?.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const feeId = session?.metadata?.feeId || session?.client_reference_id;
      if (feeId) {
        await processFeePaymentSuccess(feeId);
        console.log(`[stripe-webhook] Fee ${feeId} processed and marked paid via checkout session.`);
      }
    }

    res.json({ received: true });
  })
);

/**
 * POST /api/webhooks/confirm-simulation
 * Simulation confirmation endpoint for local dev testing without live Stripe webhooks.
 */
router.post(
  '/confirm-simulation',
  express.json(),
  asyncHandler(async (req, res) => {
    const { feeId } = req.body;
    if (!feeId) {
      return res.status(400).json({ message: 'feeId is required' });
    }

    const fee = await processFeePaymentSuccess(feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee not found.' });
    }

    res.json({
      success: true,
      message: 'Payment simulation completed successfully.',
      fee,
    });
  })
);

module.exports = router;
