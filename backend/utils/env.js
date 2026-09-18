/**
 * Validates required environment variables and warns about optional ones.
 */
function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const missing = [];
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    missing.push('MONGO_URI');
  }
  if (!process.env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  }

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
