/**
 * src/utils/constants.js — Shared Application Constants
 *
 * Single source of truth for values that must be consistent
 * across multiple layers (Mongoose validators, express-validator,
 * future utilities, etc.).
 *
 * Import this module instead of duplicating literals in each file.
 */

// ── Reserved Usernames ────────────────────────────────────────────────────────
/**
 * Usernames that are exempt from the normal 3-character minimum length rule.
 * These are privileged, short identifiers reserved for system/admin accounts.
 *
 * Rules that apply to ALL usernames (including reserved ones):
 *  - Only letters, numbers, and underscores
 *  - Must not exceed 30 characters
 *
 * Rules that apply ONLY to non-reserved usernames:
 *  - Must be at least 3 characters
 */
const RESERVED_ALLOWED = ["ts", "admin", "owner"];

/**
 * Returns true if the given username is in the reserved-allowed list.
 * Comparison is case-insensitive.
 * @param {string} username
 * @returns {boolean}
 */
const isReservedUsername = (username) =>
  RESERVED_ALLOWED.includes((username || "").toLowerCase().trim());

/**
 * Validates a username string.
 * Returns null on success, or an error message string on failure.
 * @param {string} username
 * @returns {string|null}
 */
const validateUsername = (username) => {
  if (!username) return "Username is required.";

  const trimmed = username.trim();

  // Character-set check applies to all usernames
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return "Username can only contain letters, numbers, and underscores.";
  }

  // Length check is bypassed for reserved usernames
  if (!isReservedUsername(trimmed) && (trimmed.length < 3 || trimmed.length > 30)) {
    return "Username must be 3–30 characters.";
  }

  return null; // valid
};

module.exports = { RESERVED_ALLOWED, isReservedUsername, validateUsername };
