/**
 * src/services/user.service.js — User API calls
 */

import api from "./api";

/**
 * Search users by username (excluding self).
 * @param {string} query — search term (min 2 chars)
 */
export const searchUsers = (query) => api.get("/users/search", { params: { q: query } });

/**
 * Get a user's public profile.
 * @param {string} userId
 */
export const getUserById = (userId) => api.get(`/users/${userId}`);

/**
 * Update the current user's profile.
 * @param {{ avatar?: string, bio?: string }} data
 */
export const updateProfile = (data) => api.put("/users/profile", data);
