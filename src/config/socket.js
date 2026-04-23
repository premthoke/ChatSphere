/**
 * src/config/socket.js — Socket.IO Configuration
 *
 * Initialises Socket.IO on the shared HTTP server.
 * Provides:
 *   - initSocket(server)  — called once at startup
 *   - getIO()             — returns the io instance anywhere in the app
 *
 * Real-time events handled here:
 *   • connection / disconnect
 *   • join_room  — user joins a private chat room
 *   • send_message — message sent in a room (broadcast to other participants)
 *   • typing / stop_typing — typing indicators
 */

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

let io; // Singleton Socket.IO instance

/**
 * Attach Socket.IO to the HTTP server.
 * @param {import("http").Server} server
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Ping interval / timeout (ms) — keeps connections alive
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // ── Socket.IO Auth Middleware ─────────────────────────────────────────────
  // Verify the JWT token sent in the handshake before allowing connection.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication token missing"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // attach user payload to socket
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  // ── Connection Handler ────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    logger.info(`🔌 Socket connected: ${socket.id} (user: ${userId})`);

    /**
     * join_room — Client joins a unique chat room.
     * Room name convention: sorted user IDs joined by "_"
     * e.g. user1Id_user2Id  (always same regardless of who initiates)
     */
    socket.on("join_room", ({ roomId }) => {
      socket.join(roomId);
      logger.info(`User ${userId} joined room: ${roomId}`);
    });

    /**
     * send_message — Broadcast a new message to everyone else in the room.
     * The REST API handles persistence; this only handles real-time delivery.
     */
    socket.on("send_message", ({ roomId, message }) => {
      // Emit to all OTHER clients in the room (not the sender)
      socket.to(roomId).emit("receive_message", message);
    });

    /**
     * typing — Broadcast typing indicator to room participants.
     */
    socket.on("typing", ({ roomId }) => {
      socket.to(roomId).emit("user_typing", { userId });
    });

    /**
     * stop_typing — Clear typing indicator.
     */
    socket.on("stop_typing", ({ roomId }) => {
      socket.to(roomId).emit("user_stopped_typing", { userId });
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} — reason: ${reason}`);
    });
  });

  logger.info("⚡ Socket.IO initialised");
  return io;
};

/**
 * Get the Socket.IO singleton instance.
 * Call this from controllers that need to emit server-side events.
 * @returns {import("socket.io").Server}
 */
const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialised — call initSocket(server) first");
  return io;
};

module.exports = { initSocket, getIO };
