/**
 * src/utils/fileHelper.js
 * Utility for handling file paths and URLs.
 */

/**
 * Constructs an absolute public URL for a file stored on the server.
 * Handles the "x-forwarded-proto" header for accurate protocol detection (HTTP/HTTPS) on Render/Heroku.
 * 
 * @param {Object} req - The Express request object.
 * @param {string} relativePath - The relative path of the file (e.g., "/uploads/file.jpg").
 * @returns {string} - The absolute URL.
 */
const getFullUrl = (req, relativePath) => {
  if (!relativePath) return "";
  
  // If it's already an absolute URL, return as is
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }

  // Normalize path (ensure it starts with /)
  const normalizedPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  
  // Detect protocol (respecting proxy/load balancer)
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  
  // Get host from request
  const host = req.get("host");

  return `${protocol}://${host}${normalizedPath}`;
};

module.exports = {
  getFullUrl,
};
