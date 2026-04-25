/**
 * src/models/user.model.js — User Mongoose Model
 *
 * Stores registered users.
 * Passwords are hashed automatically before save using bcryptjs.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ── Core Fields ──────────────────────────────────────────────────────────

    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries by default
    },

    // ── Profile ──────────────────────────────────────────────────────────────

    avatar: {
      type: String,
      default: "", // URL to avatar image (e.g. Gravatar / uploaded image)
    },

    bio: {
      type: String,
      maxlength: [150, "Bio cannot exceed 150 characters"],
      default: "",
    },

    // ── Status ───────────────────────────────────────────────────────────────

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true, // soft-delete flag
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto-managed by Mongoose
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Unique fields (username, email) automatically get indexed by Mongoose.


// ── Pre-save Hook: Hash Password ──────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  // Only re-hash if the password field was actually modified
  if (!this.isModified("password")) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ── Instance Method: Compare Password ────────────────────────────────────────
/**
 * Compare a plain-text password with the stored hash.
 * @param {string} candidatePassword — plain text from login request
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance Method: Safe Public Profile ─────────────────────────────────────
/**
 * Returns a plain object with sensitive fields removed.
 * Use this when returning user data in API responses.
 */
userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);
module.exports = User;
