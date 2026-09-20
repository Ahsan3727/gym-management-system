const { z } = require('zod');
const { appSchema } = require('./brandingSchemas');

const createBrandPackageSchema = z.object({
  name:      z.string().min(1, 'Name is required').max(40),
  emoji:     z.string().max(4).default('✨'),
  tagline:   z.string().max(80).default(''),
  memberApp: appSchema,
  adminApp:  appSchema,
}).strict();

module.exports = { createBrandPackageSchema };
