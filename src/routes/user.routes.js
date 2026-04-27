/**
 * src/routes/user.routes.js — User Routes
 *
 * GET /api/users/search?q=  — Search users by username
 * GET /api/users/:id        — Get user profile by ID
 * PUT /api/users/profile    — Update own profile
 */

const express = require("express");
const { query, param, body } = require("express-validator");
const { searchUsers, getUserById, updateProfile } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

const router = express.Router();

// All user routes require authentication
router.use(protect);

// ── Routes ────────────────────────────────────────────────────────────────────

// @route   GET /api/users/search?q=<username>
// @desc    Search users by username (excludes self)
// @access  Private
router.get(
  "/search",
  [
    query("q")
      .trim()
      .notEmpty().withMessage("Search query is required.")
      .isLength({ min: 2 }).withMessage("Query must be at least 2 characters."),
  ],
  validate,
  searchUsers
);

const { uploadAvatar } = require("../middleware/upload.middleware");

// @route   PUT /api/users/profile
// @desc    Update current user's profile (avatar / bio)
// @access  Private
router.put(
  "/profile",
  uploadAvatar.single("avatar"),
  [
    body("bio").optional().isLength({ max: 150 }).withMessage("Bio cannot exceed 150 characters."),
  ],
  validate,
  updateProfile
);

// @route   GET /api/users/:id
// @desc    Get public profile of a user by MongoDB ID
// @access  Private
// NOTE: This must be registered AFTER /search and /profile to avoid route
//       conflicts where "search" or "profile" would be treated as an :id param.
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user ID.")],
  validate,
  getUserById
);

module.exports = router;
