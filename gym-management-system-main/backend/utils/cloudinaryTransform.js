/**
 * `uploadToCloudinary` (utils/cloudinary.js) stores only the plain
 * secure_url on Admin.gymLogoUrl — no publicId — so producing the square,
 * padded 192x192 / 512x512 variants the Web App Manifest needs has to
 * happen by injecting a transformation segment into the URL string, not a
 * fresh Cloudinary API call.
 *
 * https://res.cloudinary.com/demo/image/upload/logo.png
 *   -> https://res.cloudinary.com/demo/image/upload/w_512,h_512,c_pad,b_auto,f_auto/logo.png
 *
 * Gracefully returns the original URL unchanged if it isn't a Cloudinary
 * `/upload/` URL — covers the local-dev fallback path where
 * uploadToCloudinary() returns an inline `data:` URI instead (Cloudinary
 * not configured), which obviously can't be transformed this way.
 */
function transformCloudinaryUrl(url, { width, height, maskable = false } = {}) {
  if (!url || typeof url !== 'string') return url;

  const uploadMarker = '/upload/';
  const idx = url.indexOf(uploadMarker);
  if (idx === -1) return url; // not a Cloudinary delivery URL (e.g. inline data: URI fallback)

  const before = url.slice(0, idx + uploadMarker.length);
  const after = url.slice(idx + uploadMarker.length);

  // c_pad (not c_fill/c_crop): never distorts or crops non-square logos.
  // b_auto: Cloudinary picks a sensible pad color instead of hard white/black.
  // f_auto: serve WebP/AVIF where the requesting browser supports it.
  const transform = [`w_${width}`, `h_${height}`, 'c_pad', 'b_auto', 'f_auto'];

  if (maskable) {
    // Android's maskable-icon "safe zone" is roughly the inner 80% of the
    // square — content outside that can get clipped by circle/squircle
    // masks. Chain a second c_pad step that first shrinks the logo to ~80%
    // before padding it back out to the full canvas, so nothing sits right
    // at the edge. See Phase 8's "two gyms, same device" test for how to
    // verify this actually looks right on a real launcher.
    const inner = Math.round(width * 0.8);
    return `${before}c_pad,w_${inner},h_${inner}/${transform.join(',')}/${after}`;
  }

  return `${before}${transform.join(',')}/${after}`;
}

module.exports = { transformCloudinaryUrl };
