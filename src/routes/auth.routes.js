/**
 * src/routes/auth.routes.js — Authentication Routes
 *
 * POST /api/auth/register  — Register a new user
 * POST /api/auth/login     — Login with email + password
 * GET  /api/auth/me        — Get authenticated user profile
 * POST /api/auth/logout    — Logout (mark offline)
 */

const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  getMe,
  logout,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const rateLimit = require("express-rate-limit");
const { validateUsername } = require("../utils/constants");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login/register attempts. Try again in 15 mins.",
  },
});

const router = express.Router();

// ── Validation Rules ──────────────────────────────────────────────────────────

const registerRules = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required.")
    .custom((value) => {
      // Delegates to the shared validateUsername utility (same logic as Mongoose).
      // Returns null on success, or an error message string on failure.
      const err = validateUsername(value);
      if (err) throw new Error(err);
      return true;
    }),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number."
    ),
];

const loginRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required."),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post("/register", authLimiter, registerRules, validate, register);

// @route   POST /api/auth/login
// @desc    Login user, returns JWT
// @access  Public
router.post("/login", authLimiter, loginRules, validate, login);

// @route   GET /api/auth/me
// @desc    Get currently authenticated user
// @access  Private
router.get("/me", protect, getMe);

// @route   POST /api/auth/logout
// @desc    Logout current user
// @access  Private
router.post("/logout", protect, logout);

module.exports = router;