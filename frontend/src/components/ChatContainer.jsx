import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "../components/UsersLoadingSkeleton";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    setReplyingTo, // For right-click logic
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] overflow-hidden">
      <ChatHeader />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-4xl mx-auto space-y-2">
            {messages.map((msg) => {
              const isMe = msg.senderId === authUser._id;
              
              // Find the message being replied to for the quote UI
              const repliedMsg = messages.find((m) => m._id === msg.replyTo);

              return (
                <div
                  key={msg._id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setReplyingTo(msg);
                  }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative max-w-[85%] md:max-w-[70%] p-2 rounded-lg shadow-sm ${
                      isMe 
                        ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none" 
                        : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
                    }`}
                  >
                    {/* QUOTED REPLY BUBBLE */}
                    {repliedMsg && (
                      <div className="mb-2 bg-black/20 p-2 border-l-4 border-[#00a884] rounded-md opacity-80 cursor-pointer">
                        <span className="text-[11px] font-bold text-[#00a884] block mb-0.5">
                          {repliedMsg.senderId === authUser._id ? "You" : selectedUser.fullName}
                        </span>
                        <p className="text-xs truncate text-zinc-300">
                          {repliedMsg.image ? "📷 Photo" : repliedMsg.text}
                        </p>
                      </div>
                    )}

                    {msg.image && (
                      <img src={msg.image} alt="Shared" className="rounded-md max-w-full h-auto mb-1" />
                    )}
                    
                    {msg.text && <p className="text-[14.5px] leading-relaxed pr-10">{msg.text}</p>}
                    
                    {/* RESTORED PREVIOUS TIME LOGIC */}
                    <p className="text-xs mt-1 opacity-75 flex items-center justify-end gap-1">
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <div className="flex-1">
             <MessagesLoadingSkeleton />
          </div>
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      <MessageInput />
    </div>
  );
}

export default ChatContainer;
