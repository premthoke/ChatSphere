/**
 * src/components/common/Avatar.jsx
 * Renders a user avatar circle with image or initial fallback.
 */
import { getInitial } from "../../utils/helpers";

// Resolve the avatar URL: relative /uploads/ paths need the API base URL in production
const resolveAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }
  // In dev: Vite proxy serves /uploads → backend
  // In production: use VITE_API_BASE or fallback to same origin
  const base = import.meta.env.VITE_API_BASE || "";
  return `${base}${avatarPath}`;
};

const Avatar = ({ user, size = 38, showOnline = false }) => {
  const initial = getInitial(user?.username);
  const avatarSrc = resolveAvatarUrl(user?.avatar);

  return (
    <div className="avatar">
      <div
        className="avatar-circle"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt={user?.username} />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      {showOnline && user?.isOnline && <span className="online-dot" />}
    </div>
  );
};

export default Avatar;
