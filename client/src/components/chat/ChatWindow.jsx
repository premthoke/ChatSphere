/**
 * src/components/chat/ChatWindow.jsx
 * The main message display area.
 * Shows message history, typing indicator, and scrolls to the latest message.
 */
import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput  from "./MessageInput";
import Avatar        from "../common/Avatar";
import Spinner       from "../common/Spinner";
import { groupMessagesByDate } from "../../utils/helpers";

const TypingIndicator = () => (
  <div className="typing-indicator">
    <div className="typing-dots">
      <span /><span /><span />
    </div>
    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>typing…</span>
  </div>
);

const ChatWindow = ({ selectedUser, chat }) => {
  const { messages, loadingMsgs, sendingMsg, isTyping, error, send, emitTyping } = chat;
  const bottomRef = useRef(null);

  // Auto-scroll to latest message whenever the list or typing state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── No user selected ────────────────────────────────────────────────────
  if (!selectedUser) {
    return (
      <div className="no-chat-selected">
        <div className="chat-empty-icon">💬</div>
        <div className="chat-empty-title">ChatSphere</div>
        <div className="chat-empty-sub">
          Search for a user in the sidebar and start chatting in real time.
        </div>
      </div>
    );
  }

  const grouped = groupMessagesByDate(messages);

  return (
    <div className="chat-window">
      {/* ── Header ── */}
      <div className="chat-header">
        <Avatar user={selectedUser} showOnline size={40} />
        <div className="chat-header-info">
          <div className="chat-header-name">{selectedUser.username}</div>
          <div className={`chat-header-status ${selectedUser.isOnline ? "online" : ""}`}>
            {selectedUser.isOnline ? "● Online" : "Last seen recently"}
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="messages-area" id="messages-area">
        {loadingMsgs && <Spinner />}

        {error && (
          <div className="alert alert-error" style={{ margin: "auto", width: "fit-content" }}>
            {error}
          </div>
        )}

        {!loadingMsgs && messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">👋</div>
            <div className="chat-empty-title">Start the conversation</div>
            <div className="chat-empty-sub">
              Send your first message to {selectedUser.username}!
            </div>
          </div>
        )}

        {/* Grouped messages by date */}
        {grouped.map(({ label, messages: dayMsgs }) => (
          <div key={label}>
            <div className="messages-date-divider">
              <span className="messages-date-label">{label}</span>
            </div>
            {dayMsgs.map((msg) => (
              <MessageBubble key={msg._id} message={msg} />
            ))}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Invisible anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <MessageInput
        onSend={send}
        onTyping={emitTyping}
        disabled={sendingMsg}
      />
    </div>
  );
};

export default ChatWindow;
