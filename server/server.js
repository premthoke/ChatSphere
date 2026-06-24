/**
 * server/server.js — ChatSphere Application Entry Point
 *
 * Bootstraps the Express app, connects to MongoDB,
 * attaches Socket.IO, and starts listening for connections.
 */

// ─────────────────────────────────────────────────────────────
// Load environment variables FIRST
// ─────────────────────────────────────────────────────────────
require("dotenv").config();

// ─────────────────────────────────────────────────────────────
// Core Imports
// ─────────────────────────────────────────────────────────────
const http = require("http");

const app = require("../src/app");
const connectDB = require("../src/config/db");
const { initSocket } = require("../src/config/socket");
const logger = require("../src/utils/logger");
const seedAdmin = require("../src/utils/seedAdmin");

// ─────────────────────────────────────────────────────────────
// Environment Config
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// ───────────────────────────────────────────────────────────────
// Connect MongoDB, then run startup seeds
// ───────────────────────────────────────────────────────────────
connectDB().then(() => {
  // Run admin seeder after DB is connected
  seedAdmin();
});

// ─────────────────────────────────────────────────────────────
// Create HTTP Server
// ─────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─────────────────────────────────────────────────────────────
// Initialize Socket.IO
// ─────────────────────────────────────────────────────────────
initSocket(server, app);

// ─────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(
    `🚀 ChatSphere server running on port ${PORT} [${process.env.NODE_ENV}]`
  );
});

// ─────────────────────────────────────────────────────────────
// Handle Unhandled Promise Rejections
// ─────────────────────────────────────────────────────────────
process.on("unhandledRejection", (err) => {
  logger.error(`❌ Unhandled Rejection: ${err.message}`);

  server.close(() => {
    process.exit(1);
  });
});

// ─────────────────────────────────────────────────────────────
// Handle Uncaught Exceptions
// ─────────────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  logger.error(`❌ Uncaught Exception: ${err.message}`);

  process.exit(1);
});