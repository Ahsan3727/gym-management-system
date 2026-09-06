const Admin = require('../models/Admin');

/**
 * Lowercase, hyphenated slug from arbitrary text (e.g. a gym name).
 * "Iron Clad Gym!!" -> "iron-clad-gym", "  Café  Fit  " -> "caf-fit"
 * No dependency needed for this — it's a handful of regex passes.
 */
function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics -> hyphen
    .replace(/-+/g, '-') // collapse repeats
    .replace(/^-|-$/g, ''); // trim leading/trailing hyphens
}

/**
 * Generates a slug for `gymName` guaranteed not to collide with any
 * existing Admin.slug. On collision, appends -2, -3, ... until free.
 * Pass `excludeId` when re-checking an existing admin's own slug (not
 * currently used anywhere, since slugs are immutable after creation, but
 * kept for completeness / the migration script).
 */
async function generateUniqueSlug(gymName, excludeId = null) {
  const base = slugify(gymName) || 'gym';
  let candidate = base;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    // eslint-disable-next-line no-await-in-loop
    const taken = await Admin.exists(query);
    if (!taken) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

module.exports = { slugify, generateUniqueSlug };
