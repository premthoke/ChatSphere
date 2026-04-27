/**
 * src/services/message.service.js — Message API calls
 */

import api from "./api";

/**
 * Send a message to another user.
 * @param {string|FormData} receiverIdOrFormData — MongoDB ID of the recipient OR a FormData object
 * @param {string} [content]   — message text (optional if using FormData)
 */
export const sendMessage = (receiverIdOrFormData, content) => {
  if (receiverIdOrFormData instanceof FormData) {
    return api.post("/messages", receiverIdOrFormData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.post("/messages", { receiverId: receiverIdOrFormData, content });
};

/**
 * Get paginated message history with a specific user.
 * @param {string} userId — the OTHER user's ID
 * @param {number} page
 * @param {number} limit
 */
export const getMessages = (userId, page = 1, limit = 50) =>
  api.get(`/messages/${userId}`, { params: { page, limit } });

/**
 * Get all active string conversations for the sidebar unread badges.
 */
export const getConversations = () => api.get(`/messages/conversations`);

/**
 * Soft-delete a message (sender only).
 * @param {string} messageId
 */
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`);
