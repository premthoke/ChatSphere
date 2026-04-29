/**
 * src/middleware/error.middleware.js — Centralised Error Handling
 *
 * Two middleware functions:
 *   notFoundHandler — generates a 404 error for unknown routes
 *   errorHandler    — formats and sends all errors (including Mongoose errors)
 */

const logger = require("../utils/logger");

/**
 * notFoundHandler — Middleware for unmatched routes.
 * Must be placed AFTER all route definitions.
 */
const notFoundHandler = (req, _res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

/**
 * errorHandler — Global error-handling middleware.
 * Express identifies it as an error handler by its 4-argument signature (err, req, res, next).
 */
const errorHandler = (err, req, res, _next) => {
  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // ── Mongoose: CastError (invalid ObjectId) ────────────────────────────────
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── Mongoose: Duplicate Key (unique constraint violation) ─────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // ── Mongoose: Validation Error ────────────────────────────────────────────
  if (err.name === "ValidationError") {
    statusCode = 422;
    // Collect all validation messages into a single string
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(". ");
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please log in again.";
  }

  // ── Multer Errors ─────────────────────────────────────────────────────────
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File is too large. Max limit is 5MB.";
  }
  if (err instanceof require("multer").MulterError) {
    statusCode = 400;
    message = `Upload error: ${err.message}`;
  }

  // Log server-side errors (5xx) at error level, client errors (4xx) at warn
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} — ${statusCode}: ${err.stack}`);
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} — ${statusCode}: ${message}`);
  }

  // Send consistent JSON error response
  res.status(statusCode).json({
    success: false,
    message,
    // Expose stack trace only in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFoundHandler, errorHandler };
