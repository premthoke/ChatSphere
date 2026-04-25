/**
 * src/components/chat/UserListItem.jsx
 * A single row in the sidebar user list.
 */
import Avatar from "../common/Avatar";
import { truncate } from "../../utils/helpers";

const UserListItem = ({ user, isActive, lastMessage, unreadCount, onClick }) => (
  <div
    className={`user-item ${isActive ? "active" : ""}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onClick()}
    aria-label={`Chat with ${user.username}`}
  >
    <Avatar user={user} showOnline />

    <div className="user-item-info">
      <div className="user-item-name">
        {user.username}
        {unreadCount > 0 && (
          <span style={{ 
            background: "#ef4444", 
            color: "white", 
            borderRadius: "50%", 
            padding: "2px 6px", 
            fontSize: "10px", 
            marginLeft: "8px",
            fontWeight: "bold"
          }}>
            {unreadCount}
          </span>
        )}
      </div>
      <div className="user-item-preview">
        {lastMessage
          ? truncate(lastMessage)
          : user.bio
          ? truncate(user.bio)
          : "Say hello! 👋"}
      </div>
    </div>
  </div>
);

export default UserListItem;
