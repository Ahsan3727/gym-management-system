const qrcode = require('qrcode');

/**
 * The public install link for a gym's branded PWA: opening this on a
 * member's phone (or the gym owner's) triggers the branded "Add to Home
 * Screen" flow described in IMPLEMENTATION_PLAN.md.
 *
 * Resolves the app's own public origin from the incoming request by
 * default — correct for the standard unified single-domain Vercel
 * deployment this plan targets. If you ever split frontend/backend across
 * two domains, set PUBLIC_APP_URL to the frontend's origin so this always
 * points at the right place regardless of which host answered the request.
 */
function buildInstallUrl(req, slug) {
  const origin = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${origin.replace(/\/$/, '')}/g/${slug}`;
}

/**
 * Same QR pattern already used for reception check-in (adminRoutes.js
 * `/checkin-qr`) — reused here for "Preview install" in the super admin
 * and gym-owner UIs so gym owners can print/display it in-club.
 */
async function buildInstallQr(req, slug) {
  const installUrl = buildInstallUrl(req, slug);
  const qrDataUrl = await qrcode.toDataURL(installUrl, { width: 320, margin: 2 });
  return { installUrl, qrDataUrl };
}

function buildStaffInstallUrl(req) {
  const origin = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${origin.replace(/\/$/, '')}/staff`;
}

async function buildStaffInstallQr(req) {
  const staffInstallUrl = buildStaffInstallUrl(req);
  const qrDataUrl = await qrcode.toDataURL(staffInstallUrl, { width: 320, margin: 2 });
  return { staffInstallUrl, qrDataUrl };
}

module.exports = { buildInstallUrl, buildInstallQr, buildStaffInstallUrl, buildStaffInstallQr };

