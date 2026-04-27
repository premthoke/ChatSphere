/**
 * src/pages/ChatPage.jsx
 * The main authenticated chat view.
 * Combines the Sidebar and ChatWindow with shared selected-user state.
 */
import { useState, useMemo } from "react";
import Sidebar    from "../components/chat/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import useChat    from "../hooks/useChat";
import useSocket  from "../context/useSocket";

const ChatPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { onlineStatus } = useSocket();

  // Merge static API snapshot with real-time Socket.IO presence data
  const liveSelectedUser = useMemo(() => {
    return selectedUser
      ? { ...selectedUser, ...(onlineStatus[selectedUser._id] || {}) }
      : null;
  }, [selectedUser, onlineStatus]);

  // All chat logic (messages, socket events, send, typing) lives in this hook
  const chat = useChat(liveSelectedUser);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setIsMobileOpen(false); // Close sidebar on mobile when a chat is selected
  };

  return (
    <div className="chat-layout">
      <Sidebar
        selectedUser={liveSelectedUser}
        onSelectUser={handleSelectUser}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />
      <ChatWindow
        selectedUser={liveSelectedUser}
        chat={chat}
        onMenuClick={() => setIsMobileOpen(true)}
      />
    </div>
  );
};

export default ChatPage;
