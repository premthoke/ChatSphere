/**
 * src/services/api.js — Axios Instance
 *
 * Single configured Axios instance used by all service modules.
 * - Reads the base URL from Vite env variables
 * - Injects the JWT Bearer token on every request automatically
 * - Handles 401 responses globally (clears token, redirects to login)
 */

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // 10 s
});

// ── Request Interceptor ───────────────────────────────────────────────────────
// Attach the stored JWT token to every outgoing request.
api.interceptors.request.use(
  (config) => {
    // Read from sessionStorage — matches AuthContext which writes there (tab-scoped)
    const token = sessionStorage.getItem("cs_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────────────────────
// On 401 (token expired / invalid) — clear storage and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear this tab's session — matches sessionStorage in AuthContext
      sessionStorage.removeItem("cs_token");
      sessionStorage.removeItem("cs_user");
      // Redirect only if not already on an auth page
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
