const express = require('express');

const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const { transformCloudinaryUrl } = require('../utils/cloudinaryTransform');

const router = express.Router();

// NOTE: deliberately no protect()/authorize() on this router — it must be
// readable pre-login, since it's what powers the "Add to Home Screen"
// install prompt for people who've never signed in yet. Keep the response
// shape limited to name/logo/color; never add anything sensitive here (see
// app.js mount comment).

const DEFAULT_ICON_192 = '/icon-192.png';
const DEFAULT_ICON_512 = '/icon-512.png';
const DEFAULT_THEME_COLOR = '#ff4e1f';
const DEFAULT_BACKGROUND_COLOR = '#0b0c10';
const DEFAULT_GYM_NAME = 'Ironline Gym Management Platform';
const DEFAULT_SHORT_NAME = 'Ironline';

function shortNameFor(gymName) {
  const trimmed = (gymName || '').trim();
  if (trimmed.length <= 12) return trimmed || DEFAULT_SHORT_NAME;
  return `${trimmed.slice(0, 11)}…`;
}

function iconsFor(admin) {
  if (!admin?.gymLogoUrl) {
    return [
      { src: DEFAULT_ICON_192, type: 'image/png', sizes: '192x192' },
      { src: DEFAULT_ICON_512, type: 'image/png', sizes: '512x512' },
    ];
  }
  return [
    { src: transformCloudinaryUrl(admin.gymLogoUrl, { width: 192, height: 192 }), type: 'image/png', sizes: '192x192' },
    {
      src: transformCloudinaryUrl(admin.gymLogoUrl, { width: 512, height: 512, maskable: true }),
      type: 'image/png',
      sizes: '512x512',
      purpose: 'any maskable',
    },
  ];
}

function buildManifest(admin, slug) {
  return {
    name: admin ? admin.gymName : DEFAULT_GYM_NAME,
    short_name: admin ? shortNameFor(admin.gymName) : DEFAULT_SHORT_NAME,
    description: admin
      ? `${admin.gymName} — powered by Ironline.`
      : 'Multi-tenant fitness, workout tracking, attendance streaks, and gym operations.',
    icons: iconsFor(admin),
    // Leading "/" on icon srcs above and start_url below resolves against
    // the site's ORIGIN regardless of the manifest's own URL path — so this
    // is safe to serve from /api/public/manifest/:slug rather than a static
    // /manifest.json.
    start_url: admin ? `/g/${slug}` : '/',
    background_color: DEFAULT_BACKGROUND_COLOR,
    theme_color: admin ? admin.themeColor || DEFAULT_THEME_COLOR : DEFAULT_THEME_COLOR,
    display: 'standalone',
    orientation: 'portrait',
  };
}

// GET /api/public/manifest/:slug
// Web App Manifest for a specific gym's installable identity.
//
// Unknown slug: we still return a 200 with the generic default Ironline
// manifest rather than a 404/error body. Two reasons: (1) an actual error
// status would make some browsers refuse to treat the response as an
// installable manifest at all, breaking the fallback experience for direct/
// marketing visits; (2) always returning a well-formed manifest either way
// means this endpoint can't be used to enumerate which slugs exist — a
// request for a real gym and a made-up one are indistinguishable from the
// outside.
router.get(
  '/manifest/:slug',
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    const admin = await Admin.findOne({ slug: req.params.slug }).select('gymName gymLogoUrl themeColor slug');
    res.json(buildManifest(admin, req.params.slug));
  })
);

// GET /api/public/branding/:slug
// Small JSON payload the customer app reads on page load
// (frontend-customer/src/main.jsx) to
// swap <title>, apple-touch-icon and the theme-color meta tag directly —
// needed separately from the manifest because iOS Safari never reads
// manifest.json at all.
router.get(
  '/branding/:slug',
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    const admin = await Admin.findOne({ slug: req.params.slug }).select('gymName gymLogoUrl themeColor');

    if (!admin) {
      return res.json({
        gymName: DEFAULT_GYM_NAME,
        gymLogoUrl: DEFAULT_ICON_512,
        themeColor: DEFAULT_THEME_COLOR,
      });
    }

    res.json({
      gymName: admin.gymName,
      // apple-touch-icon wants something close to square around 180px —
      // the 192 variant is close enough and avoids yet another size tier.
      gymLogoUrl: admin.gymLogoUrl
        ? transformCloudinaryUrl(admin.gymLogoUrl, { width: 192, height: 192 })
        : DEFAULT_ICON_192,
      themeColor: admin.themeColor || DEFAULT_THEME_COLOR,
    });
  })
);

module.exports = router;
