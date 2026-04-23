/**
 * src/utils/jwt.js — JSON Web Token Helpers
 *
 * Centralises token generation so algorithm and options
 * are defined in one place and consistently applied.
 */

const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT access token.
 * @param {object} payload — Data to embed in the token (e.g. { id, username })
 * @returns {string} Signed JWT string
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    algorithm: "HS256",
  });
};

/**
 * Verify and decode a JWT token.
 * Throws if the token is invalid or expired.
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
