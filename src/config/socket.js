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
const User = require("../models/user.model");
const Message = require("../models/message.model");

let io; // Singleton Socket.IO instance
const userSocketMap = new Map(); // Tracks active sockets: Map<userId, Set<socketId>>

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
  io.on("connection", async (socket) => {
    const userId = socket.user?.id;
    logger.info(`🔌 Socket connected: ${socket.id} (user: ${userId})`);

    if (userId) {
      socket.join(userId); // Join personal room for cross-tab global synchronization

      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
        // First connection for this user
        try {
          await User.findByIdAndUpdate(userId, { isOnline: true });
          io.emit("userOnline", { userId });
        } catch (err) {
          logger.error(`Error updating online status for ${userId}: ${err.message}`);
        }
      }
      userSocketMap.get(userId).add(socket.id);
    }

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
     */
    socket.on("send_message", ({ roomId, message, conversation }) => {
      // Emit to all OTHER clients in the room (not the sender)
      socket.to(roomId).emit("receive_message", message);
      // Emit the conversation update to BOTH users seamlessly across all open tabs
      if (conversation) {
        conversation.participants.forEach(p => {
          const pStr = p._id ? p._id.toString() : p.toString();
          io.to(pStr).emit("updateConversation", conversation);
        });
      }
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

    /**
     * mark_read — Update read receipts for messages sent by the other user.
     */
    socket.on("mark_read", async ({ roomId, selectedUserId }) => {
      try {
        await Message.updateMany(
          { roomId, sender: selectedUserId, receiver: userId, isRead: false },
          { isRead: true, readAt: new Date() }
        );
        
        // Safely wipe the bubble notification counter when inside the chat natively
        const Conversation = require("../models/conversation.model");
        const conversation = await Conversation.findOne({ roomId });
        if (conversation) {
          conversation.unreadCount.set(userId.toString(), 0);
          await conversation.save();
          // Inform both parties the conversation object updated its stats globally
          conversation.participants.forEach(p => {
            const pStr = p._id ? p._id.toString() : p.toString();
            io.to(pStr).emit("updateConversation", conversation);
          });
        }

        // Emit to the room that messages were read
        io.to(roomId).emit("messages_read", { readerId: userId, roomId });
      } catch (err) {
        logger.error(`Error marking messages read for room ${roomId}: ${err.message}`);
      }
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", async (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} — reason: ${reason}`);

      if (userId && userSocketMap.has(userId)) {
        const userSockets = userSocketMap.get(userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          // No more active sockets
          userSocketMap.delete(userId);
          const lastSeen = new Date();
          try {
            await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
            io.emit("userOffline", { userId, lastSeen });
          } catch (err) {
            logger.error(`Error updating offline status for ${userId}: ${err.message}`);
          }
        }
      }
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
