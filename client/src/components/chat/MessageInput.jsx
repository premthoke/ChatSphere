/**
 * src/components/chat/MessageInput.jsx
 * Textarea + send button for composing messages.
 * Supports Enter to send (Shift+Enter for newlines)
 * and emits typing indicators.
 */
import { useState, useRef } from "react";

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MessageInput = ({ onSend, onTyping, disabled }) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping?.();
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      // Create local preview if image
      if (selected.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(selected));
      } else {
        setPreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    if ((!trimmed && !file) || disabled) return;
    onSend({ content: trimmed, file });
    setText("");
    removeFile();
  };

  return (
    <div className="message-input-area">
      {/* File Preview Bar */}
      {file && (
        <div className="file-preview-bar">
          <div className="file-preview-content">
            {preview ? (
              <img src={preview} alt="Preview" className="file-preview-img" />
            ) : (
              <div className="file-preview-doc">📄 {file.name}</div>
            )}
            <div className="file-preview-meta">
              <span className="file-preview-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
          <button className="file-preview-remove" onClick={removeFile} title="Remove attachment">
            <XIcon />
          </button>
        </div>
      )}

      <div className="message-input-row">
        <button 
          className="attach-btn" 
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach file (Max 5MB)"
          type="button"
        >
          <PaperclipIcon />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: "none" }} 
          accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png,.webp"
        />

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
          disabled={(!text.trim() && !file) || disabled}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
