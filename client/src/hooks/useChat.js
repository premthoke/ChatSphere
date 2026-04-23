/**
 * src/hooks/useChat.js — Chat Business Logic Hook
 *
 * Manages the message list for the active conversation:
 *   - Fetches message history from the REST API on user selection
 *   - Subscribes to Socket.IO real-time events
 *   - Handles optimistic message sending and typing indicators
 *
 * FIX (Issue 2 — Real-time messages not updating):
 *
 *   Root causes fixed:
 *
 *   A) SocketContext previously exposed `socketRef.current` (a non-reactive ref),
 *      so this hook always received `null` for `socket` and never subscribed.
 *      Fixed in SocketContext.jsx by introducing a `socket` state variable.
 *
 *   B) The incoming socket event was named "receive_message" on the listener, but
 *      we must be consistent with what the backend actually emits. Verified and
 *      kept as "receive_message" (matching server emit in socket.js).
 *
 *   C) Duplicate message risk: when *we* send a message, we:
 *        1. Append the confirmed REST response to state immediately (optimistic).
 *        2. Emit "send_message" via socket so the OTHER user gets it.
 *      The socket listener for "receive_message" fires only for messages the
 *      SERVER broadcasts to the room — i.e., only to clients OTHER than the
 *      sender (socket.to(roomId).emit). So there is no duplicate from the server.
 *      However, if a stale listener fires or we switch conversations midstream,
 *      we guard with an ID-based Set de-duplication inside the handler.
 *
 *   D) Proper useEffect cleanup: every socket.on() is matched with a socket.off()
 *      using the exact same function reference, preventing ghost listeners when
 *      the selected user or socket instance changes.
 *
 * @param {object|null} selectedUser — the user the current user is chatting with
 */

import { useState, useEffect, useCallback, useRef } from "react";
import useSocket from "../context/useSocket";
import { useAuth }   from "../context/AuthContext";
import { getMessages, sendMessage } from "../services/message.service";
import toast from "react-hot-toast";

const useChat = (selectedUser) => {
  const { socket }  = useSocket();
  const { user }    = useAuth();

  const [messages, setMessages]       = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendingMsg, setSendingMsg]   = useState(false);
  const [isTyping, setIsTyping]       = useState(false);
  const [error, setError]             = useState(null);

  // Ref-based debounce timer for typing indicator
  const typingTimerRef = useRef(null);

  // Track message IDs we have already rendered to prevent duplicates.
  // Using a ref (not state) so updates are synchronous without causing re-renders.
  const seenIdsRef = useRef(new Set());

  // Derive the deterministic room ID shared with the backend.
  // Sort guarantees the same string regardless of who initiates the chat.
  const roomId = selectedUser
    ? [user._id, selectedUser._id].sort().join("_")
    : null;

  // ── Fetch Message History ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      seenIdsRef.current.clear();
      return;
    }

    setLoadingMsgs(true);
    setError(null);

    getMessages(selectedUser._id)
      .then(({ data }) => {
        const fetched = data.data.messages;

        // Seed the seen-IDs set from history so real-time dupes are caught
        seenIdsRef.current = new Set(fetched.map((m) => m._id));

        setMessages(fetched);
      })
      .catch(() => setError("Failed to load messages."))
      .finally(() => setLoadingMsgs(false));
  }, [selectedUser]); // Re-fetch whenever the selected conversation changes

  // ── Socket Room & Event Subscriptions ─────────────────────────────────────
  useEffect(() => {
    // FIX A: `socket` is now a reactive state value from SocketContext, so
    // this effect properly re-runs when the connection is established after
    // the initial render (previously socket was always null here).
    if (!socket || !roomId) return;

    // Join the room for this conversation on the backend
    socket.emit("join_room", { roomId });

    // ── receive_message ──────────────────────────────────────────────────
    // FIX C: De-duplicate using seenIdsRef before appending.
    // This guards against edge cases like rapid remounts or message echoes.
    const handleReceive = (message) => {
      if (!message?._id) return; // malformed payload guard

      // Skip if we already have this message (e.g. we sent it ourselves
      // and an unexpected echo arrived, or the effect ran twice in StrictMode)
      if (seenIdsRef.current.has(message._id)) return;

      seenIdsRef.current.add(message._id);
      setMessages((prev) => [...prev, message]);
    };

    // ── Typing indicators ────────────────────────────────────────────────
    const handleTyping      = () => setIsTyping(true);
    const handleStopTyping  = () => setIsTyping(false);

    socket.on("receive_message",      handleReceive);
    socket.on("user_typing",          handleTyping);
    socket.on("user_stopped_typing",  handleStopTyping);

    // FIX D: Cleanup removes the exact function references registered above.
    // Without this, changing conversations or re-connecting leaves stale
    // listeners that fire on the wrong conversation's messages.
    return () => {
      socket.off("receive_message",      handleReceive);
      socket.off("user_typing",          handleTyping);
      socket.off("user_stopped_typing",  handleStopTyping);
    };
  }, [socket, roomId]); // Re-subscribe when socket or room changes

  // ── Send Message ───────────────────────────────────────────────────────────
  const send = useCallback(async (content) => {
    if (!content.trim() || !selectedUser) return;

    setSendingMsg(true);
    try {
      // 1. Persist via REST API — this returns the server-confirmed message
      //    object with a real MongoDB _id and server timestamp.
      const { data } = await sendMessage(selectedUser._id, content.trim());
      const msg = data.data;

      // 2. Optimistic update: immediately add the message to our own UI.
      //    Mark its ID as seen so the socket listener doesn't re-add it
      //    if a spurious echo arrives.
      seenIdsRef.current.add(msg._id);
      setMessages((prev) => [...prev, msg]);

      // 3. Broadcast to the other user via Socket.IO.
      //    The backend's "send_message" handler does socket.to(roomId).emit(...)
      //    meaning ONLY the OTHER participants receive "receive_message" —
      //    we ourselves are excluded, so there's no server-side double-add.
      if (socket && roomId) {
        socket.emit("send_message", { roomId, message: msg });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSendingMsg(false);
    }
  }, [selectedUser, socket, roomId]);

  // ── Typing Indicator ───────────────────────────────────────────────────────
  const emitTyping = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit("typing", { roomId });

    // Auto-emit stop_typing 1.5 s after the last keystroke
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("stop_typing", { roomId });
    }, 1500);
  }, [socket, roomId]);

  return { messages, loadingMsgs, sendingMsg, isTyping, error, send, emitTyping };
};

export default useChat;
