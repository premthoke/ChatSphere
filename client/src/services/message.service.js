/**
 * src/services/message.service.js — Message API calls
 */

import api from "./api";

/**
 * Send a message to another user.
 * @param {string} receiverId — MongoDB ID of the recipient
 * @param {string} content   — message text
 */
export const sendMessage = (receiverId, content) =>
  api.post("/messages", { receiverId, content });

/**
 * Get paginated message history with a specific user.
 * @param {string} userId — the OTHER user's ID
 * @param {number} page
 * @param {number} limit
 */
export const getMessages = (userId, page = 1, limit = 50) =>
  api.get(`/messages/${userId}`, { params: { page, limit } });

/**
 * Soft-delete a message (sender only).
 * @param {string} messageId
 */
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`);
