/**
 * Validates required environment variables and warns about optional ones.
 */
function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const msg = `[env] FATAL: Missing required environment variable(s): ${missing.join(', ')}`;
    if (isProd) {
      throw new Error(msg);
    } else {
      console.warn(`⚠️  ${msg}. Some features will fail without them.`);
    }
  }

  const recommended = ['REFRESH_TOKEN_SECRET', 'APP_URL'];
  const missingRecommended = recommended.filter((key) => !process.env[key]);
  if (missingRecommended.length > 0 && isProd) {
    console.warn(`[env] WARNING: Recommended production variables missing: ${missingRecommended.join(', ')}`);
  }

  return true;
}

module.exports = { validateEnv };
