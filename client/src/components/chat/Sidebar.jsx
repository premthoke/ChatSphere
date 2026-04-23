/**
 * src/components/chat/Sidebar.jsx
 * Left panel with user search and user list.
 * Also shows the current user profile at the bottom.
 */
import { useState, useEffect, useCallback } from "react";
import UserListItem from "./UserListItem";
import Avatar       from "../common/Avatar";
import { useAuth }  from "../../context/AuthContext";
import useSocket from "../../context/useSocket";
import { searchUsers } from "../../services/user.service";

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const Sidebar = ({ selectedUser, onSelectUser }) => {
  const { user, logout }   = useAuth();
  const { connected }      = useSocket();

  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);

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
    <aside className="sidebar">
      {/* ── Header ── */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-dot">💬</div>
          ChatSphere
        </div>
        {/* WebSocket connection status badge */}
        <span
          style={{
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: "var(--radius-full)",
            background: connected ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)",
            color: connected ? "var(--success)" : "var(--danger)",
            fontWeight: 600,
          }}
        >
          {connected ? "● Live" : "○ Off"}
        </span>
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
            {results.map((u) => (
              <UserListItem
                key={u._id}
                user={u}
                isActive={selectedUser?._id === u._id}
                onClick={() => handleSelect(u)}
              />
            ))}
          </>
        ) : (
          <>
            {selectedUser && (
              <>
                <div className="sidebar-section-title">Active Chat</div>
                <UserListItem
                  key={selectedUser._id}
                  user={selectedUser}
                  isActive
                  onClick={() => {}}
                />
              </>
            )}
            {!selectedUser && (
              <div className="sidebar-empty">
                Search for a user above to start chatting.
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Current User Footer ── */}
      <div className="sidebar-footer">
        <Avatar user={user} showOnline size={36} />
        <div className="sidebar-footer-info">
          <div className="sidebar-footer-name">{user?.username}</div>
          <div className="sidebar-footer-role">You</div>
        </div>
        <button
          id="logout-btn"
          className="logout-btn"
          onClick={logout}
          title="Logout"
          aria-label="Logout"
        >
          <LogoutIcon />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
