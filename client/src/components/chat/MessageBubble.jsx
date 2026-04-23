/**
 * src/components/chat/MessageBubble.jsx
 * Renders a single message bubble (sent or received).
 */
import { formatTime } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";

const MessageBubble = ({ message }) => {
  const { user } = useAuth();
  const isSent   = message.sender?._id === user._id || message.sender === user._id;
  const deleted  = message.isDeleted;

  return (
    <div className={`message-row ${isSent ? "sent" : "received"}`}>
      <div className={`message-bubble ${deleted ? "message-deleted" : ""}`}>
        {deleted ? "This message was deleted." : message.content}

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
