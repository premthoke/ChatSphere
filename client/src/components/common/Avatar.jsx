/**
 * src/components/common/Avatar.jsx
 * Renders a user avatar circle with image or initial fallback.
 */
import { getInitial, resolveFileUrl } from "../../utils/helpers";
import { useState } from "react";

const Avatar = ({ user, size = 38, showOnline = false }) => {
  const [imgError, setImgError] = useState(false);
  const initial = getInitial(user?.username);
  const avatarSrc = resolveFileUrl(user?.avatar);

  return (
    <div className="avatar">
      <div
        className="avatar-circle"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {avatarSrc && !imgError ? (
          <img 
            src={avatarSrc} 
            alt={user?.username} 
            onError={() => setImgError(true)} 
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {showOnline && user?.isOnline && <span className="online-dot" />}
    </div>
  );
};

export default Avatar;
