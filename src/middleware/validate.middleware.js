/**
 * src/middleware/validate.middleware.js — Request Validation Middleware
 *
 * Runs express-validator results and short-circuits with a 422 response
 * if any validation rule failed. Use after validation rule chains.
 *
 * Usage:
 *   router.post("/register", [...validationRules], validate, controller)
 */

const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return the first validation error message for simplicity
    const firstError = errors.array({ onlyFirstError: true })[0];
    return res.status(422).json({
      success: false,
      message: firstError.msg,
      field: firstError.path,
      errors: errors.array(),
    });
  }
  next();
};

module.exports = validate;
