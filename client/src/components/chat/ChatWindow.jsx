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
import ProfileModal  from "../profile/ProfileModal";
import { useState }  from "react";
import { groupMessagesByDate } from "../../utils/helpers";

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const TypingIndicator = () => (
  <div className="typing-indicator">
    <div className="typing-dots">
      <span /><span /><span />
    </div>
    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>typing…</span>
  </div>
);

const ChatWindow = ({ selectedUser, chat, onMenuClick }) => {
  const { messages, loadingMsgs, sendingMsg, isTyping, error, send, emitTyping, connected } = chat;
  const bottomRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);

  // Auto-scroll to latest message whenever the list or typing state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── No user selected ────────────────────────────────────────────────────
  if (!selectedUser) {
    return (
      <div className="no-chat-selected">
        <button className="mobile-menu-btn" onClick={onMenuClick} style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
          <MenuIcon />
        </button>
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
        <button className="mobile-menu-btn" onClick={(e) => { e.stopPropagation(); onMenuClick(); }}>
          <MenuIcon />
        </button>
        
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, cursor: "pointer", transition: "opacity 0.2s" }}
          onClick={() => setShowProfile(true)}
          title="View Profile"
        >
          <Avatar user={selectedUser} showOnline size={42} />
          <div className="chat-header-info">
            <div className="chat-header-name">{selectedUser.username}</div>
            <div className={`chat-header-status ${selectedUser.isOnline ? "online" : ""}`}>
              {selectedUser.isOnline 
                ? "● Online" 
                : selectedUser.lastSeen 
                  ? `Last seen at ${new Date(selectedUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                  : "Offline"}
            </div>
          </div>
        </div>

        {/* Reconnecting Indicator */}
        {!connected && (
          <div style={{
            fontSize: "0.75rem",
            fontWeight: "600",
            color: "#b45309",
            backgroundColor: "#fef3c7",
            padding: "4px 8px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            border: "1px solid #fde68a"
          }}>
            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b", animation: "pulse 1.5s infinite" }}></span>
            Reconnecting...
          </div>
        )}
      </div>

      {/* Conditional Profile View Modal */}
      {showProfile && (
        <ProfileModal 
          user={selectedUser} 
          isSelf={false} 
          onClose={() => setShowProfile(false)} 
        />
      )}

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
        disabled={sendingMsg || !connected}
      />
    </div>
  );
};

export default ChatWindow;
