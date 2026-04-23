/**
 * src/controllers/message.controller.js — Message Controller
 *
 * Handles sending and retrieving messages.
 * After saving a message to MongoDB, emits a Socket.IO event
 * so the receiver gets it in real-time without polling.
 */

const Message = require("../models/message.model");
const User = require("../models/user.model");
const { createError } = require("../utils/apiError");

// ── Send Message ──────────────────────────────────────────────────────────────
/**
 * POST /api/messages
 * Body: { receiverId, content, type? }
 * Requires: protect middleware
 */
const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { receiverId, content, type = "text" } = req.body;

    // Prevent users from messaging themselves
    if (senderId.toString() === receiverId) {
      return next(createError(400, "You cannot send a message to yourself."));
    }

    // Verify the receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver || !receiver.isActive) {
      return next(createError(404, "Receiver not found."));
    }

    // Generate deterministic room ID for this conversation
    const roomId = Message.generateRoomId(senderId, receiverId);

    // Persist message to MongoDB
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      roomId,
      content,
      type,
    });

    // Populate sender details for the response / socket payload
    await message.populate("sender", "username avatar");
    await message.populate("receiver", "username avatar");

    res.status(201).json({
      success: true,
      message: "Message sent.",
      data: message,
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Messages Between Two Users ────────────────────────────────────────────
/**
 * GET /api/messages/:userId
 * Params: userId — the OTHER user's ID
 * Query:  page (default 1), limit (default 30)
 * Requires: protect middleware
 */
const getMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { userId: otherUserId } = req.params;

    // Verify the other user exists
    const otherUser = await User.findById(otherUserId).select("username avatar isOnline");
    if (!otherUser) {
      return next(createError(404, "User not found."));
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 30);
    const skip = (page - 1) * limit;

    // Get room ID and fetch messages
    const roomId = Message.generateRoomId(currentUserId, otherUserId);

    const [messages, total] = await Promise.all([
      Message.find({ roomId, isDeleted: false })
        .populate("sender", "username avatar")
        .populate("receiver", "username avatar")
        .sort({ createdAt: 1 }) // oldest → newest (chronological order)
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ roomId, isDeleted: false }),
    ]);

    // Mark unread messages as read (messages sent TO the current user)
    await Message.updateMany(
      { roomId, receiver: currentUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      data: {
        messages,
        participant: otherUser,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalMessages: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Delete Message (Soft Delete) ──────────────────────────────────────────────
/**
 * DELETE /api/messages/:messageId
 * Requires: protect middleware
 * Only the sender can delete their own message.
 */
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return next(createError(404, "Message not found."));
    }

    // Authorization: only sender can delete
    if (message.sender.toString() !== req.user._id.toString()) {
      return next(createError(403, "You can only delete your own messages."));
    }

    message.isDeleted = true;
    message.content = "This message was deleted."; // Overwrite content for privacy
    await message.save();

    res.status(200).json({ success: true, message: "Message deleted." });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getMessages, deleteMessage };
