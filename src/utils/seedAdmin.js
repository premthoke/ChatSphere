/**
 * src/utils/seedAdmin.js — Admin Account Seeder
 *
 * Runs once at server startup (after MongoDB connects).
 * Creates the seeded admin account ONLY if it does not already exist.
 *
 * SECURITY RULES:
 *  ✅ Reads credentials from environment variables ONLY.
 *  ✅ Never hardcodes credentials in source code.
 *  ✅ Uses the normal User model — bcrypt pre-save hook hashes the password.
 *  ✅ Does NOT bypass JWT authentication.
 *  ✅ Does NOT create special login routes.
 *  ✅ Idempotent — safe to call on every restart.
 *  ✅ Skips gracefully if env vars are missing (no crash).
 *
 * Required environment variables:
 *   ADMIN_USERNAME  — short username for the admin account
 *   ADMIN_EMAIL     — admin email address
 *   ADMIN_PASSWORD  — plaintext password (will be bcrypt-hashed on save)
 */

const User = require("../models/user.model");
const logger = require("./logger");

const seedAdmin = async () => {
  // ── 1. Guard: skip if any required env var is missing ────────────────────────
  const username = process.env.ADMIN_USERNAME;
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    logger.warn(
      "⚠️  Admin seed skipped — missing environment variables " +
        "(ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD)."
    );
    return;
  }

  try {
    // ── 2. Check for existing account by username OR email ────────────────────
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username }],
    });

    if (existing) {
      // ── 3a. Account exists — ensure role is "admin" ───────────────────────
      if (existing.role !== "admin") {
        await User.findByIdAndUpdate(existing._id, { role: "admin" });
        logger.info(
          `🔧 Admin seeder: upgraded existing account '${existing.username}' to role=admin.`
        );
      } else {
        logger.info(
          `✅ Admin seeder: account '${existing.username}' already exists — skipping creation.`
        );
      }
      return;
    }

    // ── 3b. Account does not exist — create it ────────────────────────────────
    // new User(...).save() triggers the pre-save bcrypt hook → password is hashed.
    // User.create() also works, but explicit new+save makes the hook intent clearer.
    const admin = new User({ username, email, password, role: "admin" });
    await admin.save();

    logger.info(
      `🌱 Admin seeder: created admin account '${username}' (${email}) with role=admin.`
    );
  } catch (err) {
    // Log the error but DO NOT crash the server — seeding is non-critical.
    logger.error(`❌ Admin seeder error: ${err.message}`);
  }
};

module.exports = seedAdmin;
