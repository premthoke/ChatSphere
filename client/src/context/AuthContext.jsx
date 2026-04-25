/**
 * src/context/AuthContext.jsx — Global Authentication State
 *
 * Provides: { user, token, login, register, logout, loading }
 *
 * FIX (Issue 1 — Multi-tab conflict):
 *   Switched from localStorage → sessionStorage.
 *   sessionStorage is tab-scoped: each browser tab has its own isolated storage,
 *   so logging into Account B in Tab 2 no longer overwrites the token used by Tab 1.
 *   Trade-off: a new tab opened via Ctrl+T starts fresh (user must log in again).
 *   Session still survives hard refreshes within the same tab.
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, logoutUser, getMe } from "../services/auth.service";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

const TOKEN_KEY = "cs_token";
const USER_KEY  = "cs_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY)); }
    catch { return null; }
  });
  const [token, setToken]     = useState(() => sessionStorage.getItem(TOKEN_KEY) || null);
  // Show a loading spinner on refresh only when this tab already has a token stored
  const [loading, setLoading] = useState(!!sessionStorage.getItem(TOKEN_KEY));

  // ── Re-hydrate user from backend on mount (validates stored token) ─────────
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    getMe()
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        // Token invalid/expired — clear everything
        _clearSession();
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // ── Helpers ───────────────────────────────────────────────────────────────
  const _saveSession = (token, user) => {
    // sessionStorage: tab-isolated, persists across same-tab refreshes
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const _clearSession = () => {
    // Clears only this tab's session — other tabs are unaffected
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  /** @returns {{ success: boolean, error?: string }} */
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await loginUser({ email, password });
      _saveSession(data.token, data.user);
      toast.success(`Welcome back, ${data.user.username}! 👋`);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Try again.";
      return { success: false, error: msg };
    }
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (username, email, password) => {
    try {
      const { data } = await registerUser({ username, email, password });
      _saveSession(data.token, data.user);
      toast.success(`Account created! Welcome, ${data.user.username} 🎉`);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Try again.";
      return { success: false, error: msg };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await logoutUser(); } catch { /* ignore backend errors on logout */ }
    _clearSession();
    toast("Logged out", { icon: "👋" });
  }, []);

  // ── Session Mutators ──────────────────────────────────────────────────────
  const updateUser = useCallback((updatedProps) => {
    setUser((prev) => {
      const newUser = { ...prev, ...updatedProps };
      sessionStorage.setItem(USER_KEY, JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const value = { user, token, loading, login, register, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Hook to consume the auth context */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
