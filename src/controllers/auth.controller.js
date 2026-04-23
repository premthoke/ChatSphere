/**
 * src/controllers/auth.controller.js — Authentication Controller
 *
 * Handles user registration and login.
 * Generates and returns JWT tokens on successful auth.
 */

const User = require("../models/user.model");
const { generateToken } = require("../utils/jwt");
const { createError } = require("../utils/apiError");

// ── Register ──────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Body: { username, email, password }
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check for duplicate email or username (Mongoose unique will also catch this,
    // but checking here gives a cleaner error message before hitting DB uniqueness)
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Username";
      return next(createError(409, `${field} is already registered.`));
    }

    // Create user — password is hashed automatically by the pre-save hook
    const user = await User.create({ username, email, password });

    // Generate access token
    const token = generateToken({ id: user._id, username: user.username });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: user.toPublicProfile(),
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password since the schema hides it by default
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      // Intentionally vague message — don't reveal which field is wrong
      return next(createError(401, "Invalid email or password."));
    }

    if (!user.isActive) {
      return next(createError(403, "Your account has been deactivated. Contact support."));
    }

    // Mark user as online
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false }); // skip full validation on status update

    const token = generateToken({ id: user._id, username: user.username });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: user.toPublicProfile(),
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Current User (Me) ─────────────────────────────────────────────────────
/**
 * GET /api/auth/me
 * Requires: protect middleware
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is already populated by the protect middleware
    res.status(200).json({
      success: true,
      user: req.user.toPublicProfile(),
    });
  } catch (err) {
    next(err);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/logout
 * Requires: protect middleware
 * Marks the user as offline. The client must discard the JWT.
 */
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    });

    res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, logout };
