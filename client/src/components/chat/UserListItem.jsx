/**
 * src/components/chat/UserListItem.jsx
 * A single row in the sidebar user list.
 */
import Avatar from "../common/Avatar";
import { truncate } from "../../utils/helpers";

const UserListItem = ({ user, isActive, lastMessage, onClick }) => (
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
      <div className="user-item-name">{user.username}</div>
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
