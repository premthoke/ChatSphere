/**
 * src/components/common/Avatar.jsx
 * Renders a user avatar circle with image or initial fallback.
 */
import { getInitial } from "../../utils/helpers";

const Avatar = ({ user, size = 38, showOnline = false }) => {
  const initial = getInitial(user?.username);

  return (
    <div className="avatar">
      <div
        className="avatar-circle"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user.username} />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      {showOnline && user?.isOnline && <span className="online-dot" />}
    </div>
  );
};

export default Avatar;
