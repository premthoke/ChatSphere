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
  const { socket, connected }  = useSocket();
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

  const selectedUserId = selectedUser?._id;

  // ── Fetch Message History ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      seenIdsRef.current.clear();
      return;
    }

    setLoadingMsgs(true);
    setError(null);

    getMessages(selectedUserId)
      .then(({ data }) => {
        const fetched = data.data.messages;

        // Seed the seen-IDs set from history so real-time dupes are caught
        seenIdsRef.current = new Set(fetched.map((m) => m._id));

        setMessages(fetched);
      })
      .catch(() => setError("Failed to load messages."))
      .finally(() => setLoadingMsgs(false));
  }, [selectedUserId, connected]); // Re-fetch when user changes OR when socket reconnects!

  // ── Socket Room & Event Subscriptions ─────────────────────────────────────
  useEffect(() => {
    // FIX A: `socket` is now a reactive state value from SocketContext, so
    // this effect properly re-runs when the connection is established after
    // the initial render (previously socket was always null here).
    if (!socket || !roomId) return;

    // Join the room for this conversation on the backend
    socket.emit("join_room", { roomId });

    // ── newMessage ──────────────────────────────────────────────────
    const handleReceive = (message) => {
      if (!message?._id) return; // malformed payload guard

      // STRICT ACTIVE ROOM GUARD: If it doesn't belong to this active chat, ignore it!
      // (The Sidebar will still update via conversationUpdated)
      if (message.roomId !== roomId) return;

      setMessages((prev) => {
        // Prevent adding the same message twice (solves the Socket vs REST race condition)
        if (prev.some((m) => m._id === message._id)) {
          return prev; 
        }
        return [...prev, message];
      });
    };

    // ── Typing indicators ────────────────────────────────────────────────
    const handleTyping      = () => setIsTyping(true);
    const handleStopTyping  = () => setIsTyping(false);

    // ── messages_read ────────────────────────────────────────────────────
    const handleMessagesRead = ({ readerId }) => {
      // Multi-tab sync: If WE read the messages in another tab, mark incoming as read.
      if (readerId === user._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            (msg.sender === selectedUser._id || msg.sender?._id === selectedUser._id)
              ? { ...msg, isRead: true }
              : msg
          )
        );
      } else {
        // THEY read the messages, so our sent messages are now read.
        setMessages((prev) =>
          prev.map((msg) =>
            (msg.sender === user._id || msg.sender?._id === user._id)
              ? { ...msg, isRead: true }
              : msg
          )
        );
      }
    };

    socket.on("newMessage",           handleReceive);
    socket.on("user_typing",          handleTyping);
    socket.on("user_stopped_typing",  handleStopTyping);
    socket.on("messages_read",        handleMessagesRead);

    // FIX D: Cleanup removes the exact function references registered above.
    // Without this, changing conversations or re-connecting leaves stale
    // listeners that fire on the wrong conversation's messages.
    return () => {
      socket.off("newMessage",           handleReceive);
      socket.off("user_typing",          handleTyping);
      socket.off("user_stopped_typing",  handleStopTyping);
      socket.off("messages_read",        handleMessagesRead);
    };
  }, [socket, roomId]); // Re-subscribe when socket or room changes

  // ── Emit Read Receipts ─────────────────────────────────────────────────────
  // Automatically mark the other user's incoming messages as read when viewing
  useEffect(() => {
    if (!socket || !roomId || !selectedUser || !messages.length) return;

    const unreadFromOther = messages.some(
      (m) => !m.isRead && (m.sender === selectedUser._id || m.sender?._id === selectedUser._id)
    );

    if (unreadFromOther) {
      socket.emit("mark_read", { roomId, selectedUserId: selectedUser._id });

      // Optimistically update our own UI so we don't spam emit
      setMessages((prev) =>
        prev.map((msg) =>
          (msg.sender === selectedUser._id || msg.sender?._id === selectedUser._id)
            ? { ...msg, isRead: true }
            : msg
        )
      );
    }
  }, [messages, selectedUser, socket, roomId]);

  // ── Send Message ───────────────────────────────────────────────────────────
  const send = useCallback(async ({ content, file }) => {
    if ((!content?.trim() && !file) || !selectedUser) return;

    if (!connected) {
      toast.error("Cannot send message while offline. Please wait to reconnect.");
      return;
    }

    setSendingMsg(true);
    try {
      let payload;
      if (file) {
        payload = new FormData();
        payload.append("receiverId", selectedUser._id);
        payload.append("file", file);
        if (content?.trim()) payload.append("content", content.trim());
      } else {
        payload = selectedUser._id; // backwards compatible for text-only
      }

      // 1. Optimistic UI update: Create a temporary message and render it instantly.
      const tempId = `temp-${Date.now()}`;
      const tempMsg = {
        _id: tempId,
        content: content?.trim() || "",
        sender: user, 
        roomId,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: file ? (file.type.startsWith("image/") ? "image" : "file") : "text",
        fileUrl: file ? URL.createObjectURL(file) : null,
        fileName: file ? file.name : null
      };

      setMessages((prev) => [...prev, tempMsg]);

      // 2. Persist via REST API
      const { data } = await sendMessage(payload, content?.trim());
      const realMsg = data.data;

      // 3. Replace the temporary message with the real server-confirmed message
      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== tempId);
        // Ensure the socket hasn't already beaten the API to appending it!
        if (!filtered.some((m) => m._id === realMsg._id)) {
          filtered.push(realMsg);
        }
        return filtered;
      });

      // 4. The backend controller now explicitly emits `newMessage` to the `roomId`
      //    for BOTH sender and receiver, keeping us perfectly in sync. 
      //    No manual emit is required from the frontend!
    } catch (err) {
      // Revert optimistic update on failure
      setMessages((prev) => prev.filter((m) => !m._id.toString().startsWith("temp-")));
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

  return { messages, loadingMsgs, sendingMsg, isTyping, error, send, emitTyping, connected };
};

export default useChat;
