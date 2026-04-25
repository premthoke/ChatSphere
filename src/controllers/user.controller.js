/**
 * src/controllers/user.controller.js — User Controller
 *
 * Handles user profile operations:
 *   - Search users by username
 *   - Get user profile by ID
 *   - Update own profile (avatar, bio)
 */

const User = require("../models/user.model");
const { createError } = require("../utils/apiError");

// ── Search Users ──────────────────────────────────────────────────────────────
/**
 * GET /api/users/search?q=<query>
 * Returns users matching the search query (by username).
 * Excludes the requesting user from results.
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return next(createError(400, "Search query must be at least 2 characters."));
    }

    // Case-insensitive regex search on username
    const users = await User.find({
      username: { $regex: q.trim(), $options: "i" },
      _id: { $ne: req.user._id }, // Exclude self
      isActive: true,
    })
      .select("username avatar bio isOnline lastSeen")
      .limit(20);

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

// ── Get User by ID ────────────────────────────────────────────────────────────
/**
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "username avatar bio isOnline lastSeen createdAt"
    );

    if (!user || !user.isActive) {
      return next(createError(404, "User not found."));
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ── Update Own Profile ────────────────────────────────────────────────────────
/**
 * PUT /api/users/profile
 * Body: { avatar?, bio? }
 * Requires: protect middleware
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ["bio"];
    const updates = {};

    // Whitelist only allowed text fields from the request body
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Support Multer mapped physical local files natively!
    if (req.file) {
      // Map it as a reliable URL pointing towards your local Express static files middleware
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    if (Object.keys(updates).length === 0) {
      return next(createError(400, "No valid fields provided to update."));
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,           // Return the updated document
      runValidators: true, // Run schema validators on update
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser.toPublicProfile(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchUsers, getUserById, updateProfile };
