/**
 * src/config/db.js — MongoDB Connection
 *
 * Uses Mongoose to connect to MongoDB.
 * Centralised here so it can be reused or mocked in tests.
 */

const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8+ no longer needs useNewUrlParser / useUnifiedTopology flags
    });

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    // Gracefully close connection when the app is shutting down
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed on app termination");
      process.exit(0);
    });
  } catch (err) {
    logger.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1); // Exit with failure so process manager can restart
  }
};

module.exports = connectDB;
