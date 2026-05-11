/**
 * src/components/chat/MessageBubble.jsx
 * Renders a single message bubble (sent or received).
 */
import { formatTime, resolveFileUrl } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";

const MessageBubble = ({ message, onDelete }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;
  const messageSenderId = message.sender?._id || message.sender?.id || message.sender;
  const isSent   = messageSenderId === currentUserId;
  const deleted  = message.isDeleted;

  // Render attachment if exists and not deleted
  const renderAttachment = () => {
    if (deleted || !message.fileUrl) return null;

    const fullUrl = resolveFileUrl(message.fileUrl);


    if (message.type === "image") {
      return (
        <div className="message-image-container">
          <a href={fullUrl} target="_blank" rel="noreferrer" download={message.fileName || "image"}>
            <img src={fullUrl} alt="Attachment" className="message-image" />
            <div className="message-image-overlay">
              <span>⬇ Download</span>
            </div>
          </a>
        </div>
      );
    }

    if (message.type === "file") {
      return (
        <a href={fullUrl} target="_blank" rel="noreferrer" download={message.fileName || "file"} className="message-file-link">
          <div className="message-file-icon">📄</div>
          <div className="message-file-info">
            <span className="message-file-name">{message.fileName || "Download File"}</span>
            <span className="message-file-download">Click to download</span>
          </div>
        </a>
      );
    }
    return null;
  };


  return (
    <div className={`message-row ${isSent ? "sent" : "received"}`}>
      <div className={`message-bubble ${deleted ? "message-deleted" : ""}`}>
        {deleted ? (
          "This message was deleted."
        ) : (
          <>
            {isSent && !deleted && (
              <button 
                className="message-delete-btn" 
                onClick={onDelete}
                title="Delete message"
              >
                🗑️
              </button>
            )}
            {renderAttachment()}
            {message.content && <div className="message-text">{message.content}</div>}
          </>
        )}

        <div className="message-meta">
          <span>{formatTime(message.createdAt)}</span>
          {isSent && (
            <span title={message.isRead ? "Read" : "Delivered"}>
              {message.isRead ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
