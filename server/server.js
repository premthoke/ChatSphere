/**
 * server.js — ChatSphere Application Entry Point
 *
 * Bootstraps the Express app, connects to MongoDB,
 * attaches Socket.IO, and starts listening for connections.
 */

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/config/socket");
const logger = require("./src/utils/logger");

// Load environment variables (must be first)
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// ── 1. Connect to MongoDB ────────────────────────────────────────────────────
connectDB();

// ── 2. Create native HTTP server (required by Socket.IO) ────────────────────
const server = http.createServer(app);

// ── 3. Attach Socket.IO to the same HTTP server ─────────────────────────────
initSocket(server);

// ── 4. Start listening ───────────────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`🚀 ChatSphere server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// ── 5. Handle unhandled promise rejections gracefully ────────────────────────
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// ── 6. Handle uncaught exceptions gracefully ─────────────────────────────────
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});
