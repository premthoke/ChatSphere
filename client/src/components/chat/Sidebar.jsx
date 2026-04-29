/**
 * src/components/chat/Sidebar.jsx
 * Left panel with user search and user list.
 * Also shows the current user profile at the bottom.
 */
import { useState, useEffect, useCallback } from "react";
import UserListItem from "./UserListItem";
import Avatar       from "../common/Avatar";
import ProfileModal from "../profile/ProfileModal";
import { useAuth }  from "../../context/AuthContext";
import useSocket from "../../context/useSocket";
import { getConversations } from "../../services/message.service";
import { searchUsers, updateProfile } from "../../services/user.service";
import toast from "react-hot-toast";

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Sidebar = ({ selectedUser, onSelectUser, isMobileOpen, onCloseMobile }) => {
  const { user, logout, updateUser }   = useAuth();
  const { connected, onlineStatus, socket } = useSocket();

  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [showOwnProfile, setShowOwnProfile] = useState(false);

  const handleSaveProfile = async ({ file, bio, removeAvatar }, closeModal = true) => {
    try {
      const fd = new FormData();
      if (file) fd.append("avatar", file);
      if (bio !== undefined) fd.append("bio", bio);
      if (removeAvatar) fd.append("removeAvatar", "true");

      const { data } = await updateProfile(fd);
      updateUser(data.data);
      if (closeModal) setShowOwnProfile(false);
      
      if (removeAvatar && !file) {
        toast.success("Profile picture removed!");
      } else if (closeModal) {
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    }
  };

  // Fetch initial conversations on mount
  useEffect(() => {
    getConversations()
      .then(({ data }) => setConversations(data.data || []))
      .catch(() => {});
  }, []);

  // Globally join all conversation rooms so this client receives backend emits dynamically
  // Depending on `connected` ensures we re-subscribe to all rooms if the socket drops and reconnects
  useEffect(() => {
    if (!socket || !connected || conversations.length === 0) return;
    conversations.forEach((c) => {
      if (c.roomId) socket.emit("join_room", { roomId: c.roomId });
    });
  }, [socket, connected, conversations]);

  // Listen for socket bumps indicating an active thread changed
  useEffect(() => {
    if (!socket) return;

    const handleConvUpdate = (updatedConv) => {
      setConversations((prev) => {
        // filter out the old instance if it exists, push the new one to the very top chronologically
        const filtered = prev.filter((c) => c._id !== updatedConv._id);
        return [updatedConv, ...filtered];
      });
    };

    socket.on("conversationUpdated", handleConvUpdate);
    socket.on("user_updated", (updatedUser) => {
      // Sync own profile across tabs
      if (updatedUser.id === (user?.id || user?._id)) {
        updateUser(updatedUser);
      }
    });

    return () => {
      socket.off("conversationUpdated",  handleConvUpdate);
      socket.off("user_updated");
    };
  }, [socket, user, updateUser]);

  // Debounced user search
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await searchUsers(query.trim());
        setResults(data.data || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400); // 400 ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback((u) => {
    onSelectUser(u);
    setQuery("");
    setResults([]);
  }, [onSelectUser]);

  return (
    <aside className={`sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
      {/* ── Header ── */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-dot">💬</div>
          ChatSphere
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* WebSocket connection status badge */}
          <span
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: "var(--radius-full)",
              background: connected ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: connected ? "var(--success)" : "var(--danger)",
              fontWeight: 600,
              border: `1px solid ${connected ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
            }}
          >
            {connected ? "● Live" : "○ Off"}
          </span>
          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button className="mobile-menu-btn" onClick={onCloseMobile} style={{ marginLeft: "8px", marginRight: 0, padding: "4px" }}>
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="sidebar-search">
        <input
          id="user-search-input"
          type="text"
          placeholder="Search users…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search users"
        />
      </div>

      {/* ── User List ── */}
      <div className="sidebar-users">
        {query.length >= 2 ? (
          <>
            <div className="sidebar-section-title">
              {searching ? "Searching…" : `Results (${results.length})`}
            </div>
            {results.length === 0 && !searching && (
              <div className="sidebar-empty">No users found for "{query}"</div>
            )}
            {results.map((u) => {
              const liveU = { ...u, ...(onlineStatus[u._id] || {}) };
              return (
                <UserListItem
                  key={liveU._id}
                  user={liveU}
                  isActive={selectedUser?._id === liveU._id}
                  onClick={() => handleSelect(u)}
                />
              );
            })}
          </>
        ) : (
          <>
            {conversations.length > 0 ? (
              <>
                <div className="sidebar-section-title">Recent Chats</div>
                {conversations.map((c) => {
                  const currentUserId = user?._id || user?.id;
                  // Ensure we get the correct participant's profile
                  const otherUser = c.participants.find((p) => p._id !== currentUserId);
                  if (!otherUser) return null;

                  const liveU = { ...otherUser, ...(onlineStatus[otherUser._id] || {}) };
                  const unreadCount = c.unreadCount?.[currentUserId] || 0;

                  return (
                    <UserListItem
                      key={c._id}
                      user={liveU}
                      isActive={selectedUser?._id === liveU._id}
                      lastMessage={c.lastMessage}
                      unreadCount={unreadCount}
                      onClick={() => handleSelect(otherUser)}
                    />
                  );
                })}
              </>
            ) : (
              <div className="sidebar-empty">
                Search for a user above to start chatting.
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Current User Footer ── */}
      <div 
        className="sidebar-footer" 
        onClick={() => setShowOwnProfile(true)} 
        style={{ cursor: "pointer", transition: "background 0.2s" }}
        title="Edit Profile"
      >
        <Avatar user={user} showOnline size={36} />
        <div className="sidebar-footer-info">
          <div className="sidebar-footer-name">{user?.username}</div>
          <div className="sidebar-footer-role">You</div>
        </div>
        <button
          id="logout-btn"
          className="logout-btn"
          onClick={(e) => { e.stopPropagation(); logout(); }}
          title="Logout"
          aria-label="Logout"
        >
          <LogoutIcon />
        </button>
      </div>
      {showOwnProfile && (
        <ProfileModal
          user={user}
          isSelf={true}
          onClose={() => setShowOwnProfile(false)}
          onSave={handleSaveProfile}
        />
      )}
    </aside>
  );
};

export default Sidebar;
