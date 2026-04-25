/**
 * src/app.js — Express Application Factory
 *
 * Configures and exports the Express app instance.
 * Keeps app setup separate from server startup so it can
 * be imported in tests without starting a live server.
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const messageRoutes = require("./routes/message.routes");
const userRoutes = require("./routes/user.routes");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");

require("dotenv").config();

const app = express();

// ── Security Headers (Helmet sets sane HTTP response headers) ────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true, // allow cookies / Authorization header
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// ── Request-body parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));         // JSON body, max 10 KB
app.use(express.urlencoded({ extended: true }));  // form-encoded body

// ── HTTP request logging (skip in test env) ──────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Global Rate Limiter ───────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
  },
});
app.use("/api", limiter);

// ── Health-check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "ChatSphere API is healthy ✅", timestamp: new Date() });
});

// ── Static Files (Multer Uploads) ─────────────────────────────────────────────
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
