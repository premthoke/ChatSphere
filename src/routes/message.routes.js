/**
 * src/routes/message.routes.js — Message Routes
 *
 * POST   /api/messages              — Send a new message
 * GET    /api/messages/:userId      — Get conversation with a specific user
 * DELETE /api/messages/:messageId  — Soft-delete a message
 */

const express = require("express");
const { body, param, query } = require("express-validator");
const { sendMessage, getMessages, deleteMessage, getConversations } = require("../controllers/message.controller");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

const router = express.Router();

// All message routes require authentication
router.use(protect);

// ── Validation Rules ──────────────────────────────────────────────────────────

const sendMessageRules = [
  body("receiverId")
    .notEmpty().withMessage("Receiver ID is required.")
    .isMongoId().withMessage("Invalid receiver ID."),

  body("content")
    .trim()
    .notEmpty().withMessage("Message content cannot be empty.")
    .isLength({ max: 2000 }).withMessage("Message cannot exceed 2000 characters."),

  body("type")
    .optional()
    .isIn(["text", "image", "file", "system"]).withMessage("Invalid message type."),
];

const getMessagesRules = [
  param("userId")
    .isMongoId().withMessage("Invalid user ID."),

  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// @route   POST /api/messages
// @desc    Send a message to another user
// @access  Private
router.post("/", sendMessageRules, validate, sendMessage);

// @route   GET /api/messages/conversations
// @desc    Get all recent active conversations mapped to unread badges
// @access  Private
router.get("/conversations", getConversations);

// @route   GET /api/messages/:userId
// @desc    Get paginated message history with a specific user
// @access  Private
router.get("/:userId", getMessagesRules, validate, getMessages);

// @route   DELETE /api/messages/:messageId
// @desc    Soft-delete a message (sender only)
// @access  Private
router.delete("/:messageId", [
  param("messageId").isMongoId().withMessage("Invalid message ID."),
], validate, deleteMessage);

module.exports = router;
