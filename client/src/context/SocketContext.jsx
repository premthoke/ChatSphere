/**
 * src/context/SocketContext.jsx — Socket.IO Connection Management
 *
 * Creates and manages a single Socket.IO connection for the app.
 * The socket is created when the user is logged in and
 * destroyed when they log out or the component unmounts.
 *
 * FIX (Issue 2 — Real-time messages):
 *   Previously the socket instance was held only in a useRef and the context
 *   value read `socketRef.current` directly. Because ref mutations don’t
 *   trigger re-renders, consumers (e.g. useChat) always received null on first
 *   render and never re-subscribed when the connection was established.
 *
 *   Fix: maintain a parallel `socket` state that is updated when the
 *   connection opens/closes, so every consumer re-renders with the live
 *   socket instance. The ref is kept to avoid stale-closure issues inside
 *   async callbacks that need to call socket.disconnect().
 *
 * Provides: { socket, connected }
 */

import { createContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

// Export the context object so the separated useSocket hook can import it
export const SocketContext = createContext(null);

// In development, connect to the same origin so Socket.IO traffic routes
// through Vite's dev proxy (/socket.io → localhost:5000), avoiding CORS issues.
// In production, VITE_SOCKET_URL should be set to the actual backend URL.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();

  // socketRef: holds the raw io() instance — safe to use in cleanup closures
  // without stale-closure risk.
  const socketRef = useRef(null);

  // socket (state): mirrors socketRef.current so that context consumers
  // re-render whenever the connection is established or torn down.
  const [socket, setSocket]       = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState({});

  useEffect(() => {
    // Only connect when we have a valid auth token
    if (!token) {
      // If there's an existing socket, disconnect it cleanly
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);      // <-- notify consumers
        setConnected(false);
      }
      return;
    }

    // Create Socket.IO connection with JWT in auth handshake
    const sock = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"], // Force WebSocket for production
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = sock;
    // Expose to consumers — triggers re-render in useChat etc.
    setSocket(sock);

    sock.on("connect", () => setConnected(true));
    sock.on("disconnect", () => setConnected(false));
    sock.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
      setConnected(false);
    });

    sock.on("userOnline", ({ userId }) => {
      setOnlineStatus((prev) => ({
        ...prev,
        [userId]: { isOnline: true },
      }));
    });

    sock.on("userOffline", ({ userId, lastSeen }) => {
      setOnlineStatus((prev) => ({
        ...prev,
        [userId]: { isOnline: false, lastSeen },
      }));
    });

    // Cleanup: disconnect when token changes or component unmounts
    return () => {
      sock.disconnect();
      socketRef.current = null;
      setSocket(null);        // <-- clear reactive value
      setConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected, onlineStatus }}>
      {children}
    </SocketContext.Provider>
  );
};


