/**
 * src/utils/logger.js — Winston Logger
 *
 * Provides structured, levelled logging.
 * In development: colourful console output.
 * In production:  logs to rotating files (combined.log & error.log).
 */

const { createLogger, format, transports } = require("winston");
const path = require("path");

const { combine, timestamp, printf, colorize, errors } = format;

// Custom single-line log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }), // Log full stack traces for Error objects
    logFormat
  ),
  transports: [
    // ── Console Transport (always enabled) ───────────────────────────────────
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: "HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
      ),
    }),
  ],
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
});

// ── File Transports (production only) ────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  logger.add(
    new transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
      maxsize: 5_242_880,  // 5 MB
      maxFiles: 5,
    })
  );
  logger.add(
    new transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
      maxsize: 5_242_880,
      maxFiles: 5,
    })
  );
}

module.exports = logger;
