/**
 * src/context/useSocket.js — Convenience hook for SocketContext
 *
 * Separated from SocketContext.jsx so that Vite Fast Refresh works correctly
 * (a file should export only components OR only hooks/values, not both).
 */

import { useContext } from "react";
import { SocketContext } from "./SocketContext";

/** Hook to consume the socket context */
const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside <SocketProvider>");
  return ctx;
};

export default useSocket;
