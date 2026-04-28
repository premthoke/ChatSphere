/**
 * src/controllers/message.controller.js — Message Controller
 *
 * Handles sending and retrieving messages.
 * After saving a message to MongoDB, emits a Socket.IO event
 * so the receiver gets it in real-time without polling.
 */

const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");
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
    let { receiverId, content, type } = req.body;

    // Prevent users from messaging themselves
    if (senderId.toString() === receiverId) {
      return next(createError(400, "You cannot send a message to yourself."));
    }

    let fileUrl = null;
    let fileName = null;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      
      // Determine type based on mimetype
      if (req.file.mimetype.startsWith("image/")) {
        type = "image";
      } else {
        type = "file";
      }
    } else {
      type = type || "text";
      if (!content || content.trim() === "") {
        return next(createError(400, "Message content cannot be empty."));
      }
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
      content: content || "",
      type,
      fileUrl,
      fileName,
    });

    // Find or create conversation explicitly preventing duplicates
    let conversation = await Conversation.findOne({ roomId });
    if (!conversation) {
      conversation = new Conversation({
        roomId,
        participants: [senderId, receiverId],
        unreadCount: new Map([
          [senderId.toString(), 0],
          [receiverId.toString(), 1]
        ]),
        lastMessage: message._id
      });
    } else {
      conversation.lastMessage = message._id;
      // Increment unread count for receiver ONLY
      const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
      conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    }
    await conversation.save();

    // Populate sender details for the response / socket payload
    await message.populate("sender", "username avatar");
    await message.populate("receiver", "username avatar");

    // Populate conversation details so the socket can broadcast it accurately
    await conversation.populate("participants", "username avatar isOnline");
    await conversation.populate("lastMessage");

    // Emit real-time events to the unified room directly from the backend
    const { getIO } = require("../config/socket");
    const io = getIO();
    
    io.to(roomId).emit("newMessage", message);
    
    // Broadcast conversation update to both participants' private rooms
    // This ensures the Sidebar updates even if they aren't actively "in" the chat room.
    io.to(senderId.toString()).emit("conversationUpdated", conversation);
    io.to(receiverId.toString()).emit("conversationUpdated", conversation);

    res.status(201).json({
      success: true,
      message: "Message sent.",
      data: message,
      conversation // Keep in response for backward compatibility
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

    // Zero out conversation unread bubble for the fetching user
    const conversation = await Conversation.findOne({ roomId });
    if (conversation) {
      conversation.unreadCount.set(currentUserId.toString(), 0);
      await conversation.save();
    }

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

    // Find the conversation to broadcast update
    const conversation = await Conversation.findOne({ roomId: message.roomId })
      .populate("participants", "username avatar isOnline email")
      .populate("lastMessage");

    if (conversation) {
      const { getIO } = require("../config/socket");
      const io = getIO();
      // Broadcast to both participants
      conversation.participants.forEach(p => {
        io.to(p._id.toString()).emit("conversationUpdated", conversation);
      });
    }

    res.status(200).json({ success: true, message: "Message deleted.", data: message });
  } catch (err) {
    next(err);
  }
};

// ── Get User's Active Conversations ──────────────────────────────────────────
/**
 * GET /api/messages/conversations
 * Requires: protect middleware
 */
const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const conversations = await Conversation.find({ participants: currentUserId })
      .populate("participants", "username avatar isOnline email")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getMessages, deleteMessage, getConversations };
