/**
 * src/middleware/auth.middleware.js — JWT Authentication Guard
 *
 * Verifies the Bearer token from the Authorization header.
 * Attaches the decoded user payload to req.user for downstream handlers.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { createError } = require("../utils/apiError");

/**
 * protect — Route guard that requires a valid JWT.
 * Usage: router.get("/protected", protect, controller)
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(createError(401, "Access denied. No token provided."));
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check user still exists (protects against deleted accounts)
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return next(createError(401, "User no longer exists or has been deactivated."));
    }

    // 4. Attach user to request — available in all downstream middleware & controllers
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return next(createError(401, "Invalid token. Please log in again."));
    }
    if (err.name === "TokenExpiredError") {
      return next(createError(401, "Token expired. Please log in again."));
    }
    next(err);
  }
};

module.exports = { protect };
