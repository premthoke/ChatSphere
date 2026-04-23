/**
 * src/pages/ChatPage.jsx
 * The main authenticated chat view.
 * Combines the Sidebar and ChatWindow with shared selected-user state.
 */
import { useState } from "react";
import Sidebar    from "../components/chat/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import useChat    from "../hooks/useChat";

const ChatPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  // All chat logic (messages, socket events, send, typing) lives in this hook
  const chat = useChat(selectedUser);

  return (
    <div className="chat-layout">
      <Sidebar
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
      />
      <ChatWindow
        selectedUser={selectedUser}
        chat={chat}
      />
    </div>
  );
};

export default ChatPage;
