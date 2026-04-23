/**
 * src/services/auth.service.js — Authentication API calls
 */

import api from "./api";

/** Register a new user */
export const registerUser = (data) => api.post("/auth/register", data);

/** Login — returns { token, user } */
export const loginUser = (data) => api.post("/auth/login", data);

/** Fetch the currently authenticated user */
export const getMe = () => api.get("/auth/me");

/** Logout — marks user offline on the backend */
export const logoutUser = () => api.post("/auth/logout");
