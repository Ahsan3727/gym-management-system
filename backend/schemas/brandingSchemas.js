const { z } = require('zod');
const C = require('../constants/branding');

const appSchema = z.object({
  theme: z.enum(C.THEMES),
  shell: z.enum(C.SHELLS),
  dashboard: z.enum(C.DASHBOARDS),
  surface: z.enum(C.SURFACES),
  defaultMode: z.enum(C.MODES),
}).strict();

const brandingSchema = z.object({
  memberApp: appSchema,
  adminApp: appSchema,
}).strict();

module.exports = {
  appSchema,
  brandingSchema,
};
