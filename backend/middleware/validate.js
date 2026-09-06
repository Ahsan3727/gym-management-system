/**
 * Generic Zod validation middleware factory.
 *
 * Usage:
 *   import { validate } from '../middleware/validate.js';
 *   import { createCustomerSchema } from '../schemas/adminSchemas.js';
 *
 *   router.post('/customers', validate(createCustomerSchema), asyncHandler(...));
 *
 * On failure → 400 JSON with { message, errors: { field: [msg] } }
 * On success → req.body is replaced with schema-parsed/coerced data
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed. Check the errors field for details.',
        errors: result.error.flatten().fieldErrors,
      });
    }
    // Replace raw body with parsed + coerced data (trimmed strings, coerced numbers, etc.)
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
