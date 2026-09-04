const Stripe = require('stripe');

const isConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

let stripeClient = null;
if (isConfigured) {
  stripeClient = Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('[stripe] STRIPE_SECRET_KEY is not set. Payments will run in simulated test mode.');
}

/**
 * Creates a Stripe Checkout Session for a gym member fee payment.
 * If Stripe credentials are not set in environment, generates a local simulation URL.
 *
 * @param {Object} options
 * @param {Object} options.fee - Fee document
 * @param {Object} options.customer - Customer document with user populated
 * @param {Object} options.gym - Admin document (gym)
 * @param {string} options.originUrl - Frontend base URL
 * @returns {Promise<{ id: string, url: string, isSimulated?: boolean }>}
 */
async function createFeeCheckoutSession({ fee, customer, gym, originUrl }) {
  const baseClientOrigin = originUrl || process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  if (!isConfigured || !stripeClient) {
    // Simulated checkout session for local development without active Stripe key
    const simulatedId = `sim_cs_${Date.now()}_${fee._id}`;
    const simulatedUrl = `${baseClientOrigin}/customer/account?simulated_payment=success&fee_id=${fee._id}&session_id=${simulatedId}`;
    return {
      id: simulatedId,
      url: simulatedUrl,
      isSimulated: true,
    };
  }

  const gymName = gym?.gymName || 'Ironline Gym';
  const customerEmail = customer?.user?.email || (customer?.user?.username?.includes('@') ? customer.user.username : undefined);

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: customerEmail,
    client_reference_id: fee._id.toString(),
    metadata: {
      feeId: fee._id.toString(),
      customerId: customer._id.toString(),
      adminId: fee.admin.toString(),
      gymName,
    },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(fee.amount * 100), // Stripe expects cents
          product_data: {
            name: `${gymName} — Membership Fee`,
            description: `Membership payment due ${new Date(fee.dueDate).toLocaleDateString()}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseClientOrigin}/customer/account?payment=success&fee_id=${fee._id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseClientOrigin}/customer/account?payment=cancelled`,
  });

  return {
    id: session.id,
    url: session.url,
    isSimulated: false,
  };
}

module.exports = {
  stripe: stripeClient,
  createFeeCheckoutSession,
  isConfigured,
};
