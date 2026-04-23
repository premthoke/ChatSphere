/**
 * src/components/chat/MessageInput.jsx
 * Textarea + send button for composing messages.
 * Supports Enter to send (Shift+Enter for newlines)
 * and emits typing indicators.
 */
import { useState } from "react";

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const MessageInput = ({ onSend, onTyping, disabled }) => {
  const [text, setText] = useState("");

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping?.();
  };

  const handleKeyDown = (e) => {
    // Send on Enter; Shift+Enter inserts a newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="message-input-area">
      <div className="message-input-row">
        <textarea
          id="message-input"
          rows={1}
          placeholder="Type a message… (Enter to send)"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{ lineHeight: "1.5" }}
        />
        <button
          id="send-message-btn"
          className="send-btn"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
