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
const fs = require("fs");
const path = require("path");


const authRoutes = require("./routes/auth.routes");
const messageRoutes = require("./routes/message.routes");
const userRoutes = require("./routes/user.routes");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");

require("dotenv").config();

const app = express();

app.set("trust proxy", 1);

// ── Ensure Uploads Directory Exists ──────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


// ── 2. Security Headers (Helmet sets sane HTTP response headers) ────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);


// ── 3. CORS (Secure dynamic origin validation) ───────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_ORIGIN,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if in allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// ── 4. Request-body parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));         // JSON body, max 10 KB
app.use(express.urlencoded({ extended: true }));  // form-encoded body

// ── 5. HTTP request logging (skip in test env) ──────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── 6. Rate Limiters ───────────────────────────────────────────────────────────
// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api", globalLimiter);

// ── 7. Health-check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// ── Static Files (Multer Uploads) ─────────────────────────────────────────────
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
// In production, serve the React SPA for all non-API routes (client-side routing)
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../client/dist");
  app.use(express.static(clientBuildPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.use(notFoundHandler);

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
