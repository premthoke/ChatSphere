/**
 * src/utils/apiError.js — Operational Error Factory
 *
 * Creates Error objects with a statusCode property so the global
 * error handler can pick up the right HTTP status code.
 *
 * Usage:
 *   return next(createError(404, "User not found."));
 */

/**
 * @param {number} statusCode — HTTP status code
 * @param {string} message    — Human-readable error message
 * @returns {Error}
 */
const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true; // Distinguish expected errors from programming bugs
  return err;
};

module.exports = { createError };
