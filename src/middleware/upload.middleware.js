/**
 * src/middleware/upload.middleware.js
 * 
 * Handles local file uploads using Multer.
 * Constraints enforced:
 * - Unique filenames
 * - Image max size: 3MB
 * - File max size: 5MB
 * - Allowed formats: pdf, doc, docx, txt, zip, jpg, png, webp (No videos)
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { createError } = require("../utils/apiError");

// Ensure uploads directory exists natively
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── 1. Storage Configuration ────────────────────────────────────────────────
// Generates unique filenames: <fieldname>-<userId>-<timestamp>.<ext>
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.user?._id || "anon";
    cb(null, `${file.fieldname}-${userId}-${uniqueSuffix}${ext}`);
  },
});

// ── 2. File Filters ─────────────────────────────────────────────────────────

// Avatar strictly accepts only images
const avatarFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, "Invalid file format. Only JPG, PNG, and WEBP images are allowed."), false);
  }
};

// Chat attachments accept images and documents (no video)
const messageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    "image/jpeg", 
    "image/png", 
    "image/webp",
    // Documents & Files
    "application/pdf", 
    "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "text/plain", 
    "application/zip", 
    "application/x-zip-compressed"
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, "Invalid file format. Allowed: pdf, doc, docx, txt, zip, jpg, png, webp. No videos allowed."), false);
  }
};

// ── 3. Multer Instances ─────────────────────────────────────────────────────

// Avatar upload instance (Strict 3MB limit)
const uploadAvatar = multer({
  storage: storage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
});

// Message attachment upload instance (Base 5MB limit, strict image checks applied later)
const uploadMessageFileMulter = multer({
  storage: storage,
  fileFilter: messageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB absolute max limit
});

// ── 4. Dynamic Size Validator Middleware ────────────────────────────────────
/**
 * Middleware to run AFTER uploadMessageFileMulter to strictly enforce:
 * - Images: Max 3MB
 * - Files: Max 5MB (already handled by multer limits)
 */
const enforceMessageSizeLimits = (req, res, next) => {
  if (!req.file) return next();

  const isImage = req.file.mimetype.startsWith("image/");
  const fileSizeMB = req.file.size / (1024 * 1024);

  if (isImage && fileSizeMB > 3) {
    // Delete the file since multer already saved it before we could check its final size
    fs.unlink(req.file.path, () => {});
    return next(createError(400, "Image uploads cannot exceed 3MB."));
  }

  next();
};

// Composite middleware array for message uploads
const uploadMessageFile = [
  uploadMessageFileMulter.single("file"),
  enforceMessageSizeLimits
];

module.exports = { 
  uploadAvatar, 
  uploadMessageFile 
};
