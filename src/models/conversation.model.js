const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    /**
     * Identical deterministic logic to Message's roomId
     * [userId1, userId2].sort().join("_")
     */
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Required to easily query "all conversations for a user"
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    // Map of User ObjectId (as string) to unread integer count
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Optimize querying conversations per user, sorted by most recently updated
conversationSchema.index({ participants: 1, updatedAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
