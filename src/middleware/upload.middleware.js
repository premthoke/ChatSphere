const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { createError } = require("../utils/apiError");

// Ensure uploads directory exists natively
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer physical disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique name: <userId>-<timestamp>.<ext>
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.user?._id || "anon";
    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
  },
});

// File validation filter checking strictly against injection formats
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, "Invalid file format. Only JPG, PNG, and WEBP images are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // Strict 2 MB boundary restriction mapping
  },
});

module.exports = upload;
