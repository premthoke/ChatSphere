import { useState, useRef } from "react";
import { formatTime } from "../../utils/helpers";
import Avatar from "../common/Avatar";

/**
 * ProfileModal renders a stylish overlay to physically inspect / edit a User.
 * If the user being viewed is exactly the logged-in current user,
 * text fields dynamically unlock!
 */
const ProfileModal = ({ user, isSelf, onClose, onSave }) => {
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Derived state to check if any modifications were made
  const hasChanges = 
    bio !== (user?.bio || "") || 
    file !== null || 
    removeAvatar === true;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      // Local preview securely rendering from native memory hooks
      setAvatarPreview(URL.createObjectURL(selected));
      setFile(selected);
      setRemoveAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    // Only update local state to reflect the UI change
    // The actual API call will happen when "Save Changes" is clicked
    setAvatarPreview(null);
    setFile(null);
    setRemoveAvatar(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSelf) return;

    setLoading(true);
    // Submit generic payload mapping back up to parent wrapper cleanly
    await onSave({ file, bio, removeAvatar });
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={overlayStyle}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={cardStyle}>
        <button className="modal-close-btn" onClick={onClose} style={closeBtnStyle}>✕</button>

        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
          {isSelf ? "Your Profile" : "User Profile"}
        </h2>

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Avatar Area */}
          <div style={avatarSectionStyle}>
            <div 
              style={avatarWrapperStyle} 
              onClick={() => isSelf && fileInputRef.current.click()}
            >
              {avatarPreview ? (
                 <img src={avatarPreview} alt="Preview" style={avatarImgStyle} />
              ) : (
                removeAvatar ? (
                  <div style={{ width: "100%", height: "100%", background: "#eef2f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <Avatar user={user} size={90} showOnline={false} />
                )
              )}
              {isSelf && (
                <div style={avatarOverlayStyle}>
                  📷 Edit
                </div>
              )}
            </div>
            
            {/* Remove Photo Button */}
            {isSelf && (user.avatar || avatarPreview) && !removeAvatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                style={{
                  marginTop: "8px",
                  background: "transparent",
                  color: "#ef4444",
                  border: "none",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Remove Photo
              </button>
            )}
            
            {/* Hidden mapped file hook */}
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: "none" }} 
            />
          </div>

          <h3 style={{ textAlign: "center", fontSize: "1.2rem", margin: "10px 0 5px 0" }}>
            {user.username}
          </h3>

          {!isSelf && (
            <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#666", marginBottom: "1rem" }}>
              {user.isOnline ? "🟢 Online" : `Last seen: ${formatTime(user.lastSeen)}`}
            </p>
          )}

          {/* Bio Area */}
          <div style={{ marginBottom: "1rem", width: "100%" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Bio</label>
            {isSelf ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={150}
                rows={3}
                style={textareaStyle}
                placeholder="What's on your mind?"
              />
            ) : (
              <p style={{ background: "#f1f5f9", padding: "10px", borderRadius: "8px", color: bio ? "#333" : "#aaa", minHeight: "40px" }}>
                {bio || "This user hasn't written a bio yet."}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {isSelf && (
            <button 
              type="submit" 
              disabled={loading || !hasChanges} 
              style={{
                ...submitBtnStyle,
                opacity: (loading || !hasChanges) ? 0.5 : 1,
                cursor: (loading || !hasChanges) ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

// ── Native Inline Styling mappings guaranteeing pristine layout bounds ────────
const overlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(3px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const cardStyle = {
  background: "#fff",
  padding: "24px",
  borderRadius: "16px",
  width: "90%",
  maxWidth: "350px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  position: "relative",
  animation: "fadeIn 0.2s ease-out",
  display: "flex",
  flexDirection: "column",
};

const closeBtnStyle = {
  position: "absolute",
  top: "12px",
  right: "12px",
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#999",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const avatarSectionStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  marginBottom: "10px",
};

const avatarWrapperStyle = {
  position: "relative",
  cursor: "pointer",
  borderRadius: "50%",
  overflow: "hidden",
  width: "90px",
  height: "90px",
  border: "3px solid #eef2f6",
};

const avatarImgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const avatarOverlayStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  background: "rgba(0,0,0,0.6)",
  color: "white",
  fontSize: "12px",
  textAlign: "center",
  padding: "4px 0",
  fontWeight: "bold",
};

const textareaStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  resize: "none",
  outline: "none",
  fontFamily: "inherit",
};

const submitBtnStyle = {
  padding: "10px 0",
  background: "var(--primary)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  width: "100%",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
  transition: "opacity 0.2s",
};

export default ProfileModal;
