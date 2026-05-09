import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import UsersLoadingSkeleton from './UsersLoadingSkeleton';
import { Trash2 } from "lucide-react";

const ChatsList = () => {
  const { getMyChatPartners, isUsersLoading, setSelectedUser, getFilteredItems, searchQuery, removeContact } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // 1. Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, userId }

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  const handleContextMenu = (e, userId) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      userId: userId,
    });
  };

  const closeMenu = () => setContextMenu(null);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const filteredItems = getFilteredItems();

  return (
    <div className="flex flex-col relative">
      {filteredItems.length > 0 ? (
        filteredItems.map((chat) => (
          <div
            key={chat._id}
            onContextMenu={(e) => handleContextMenu(e, chat._id)} // 2. Trigger Menu
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#202c33] transition-colors border-b border-white/5"
            onClick={() => setSelectedUser(chat)}
          >
            {/* Avatar & Online Dot */}
            <div className="relative">
              <img 
                src={chat.profilePic || "/avatar.png"} 
                className="size-12 rounded-full object-cover border border-white/5" 
                alt=""
              />
              {onlineUsers.includes(chat._id) && (
                <span className="absolute bottom-0 right-0 size-3 bg-[#00a884] border-2 border-[#111b21] rounded-full" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-[#e9edef] font-medium truncate">{chat.fullName}</h4>
              <p className="text-zinc-500 text-sm truncate">
                {onlineUsers.includes(chat._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="p-10 text-center text-zinc-500 text-sm">
          {searchQuery ? `No results found for "${searchQuery}"` : "No chats yet"}
        </div>
      )}

      {/* 3. CONTEXT MENU UI */}
      {contextMenu && (
        <>
          {/* Transparent Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeMenu} 
            onContextMenu={(e) => { e.preventDefault(); closeMenu(); }} 
          />
          
          <div 
            className="fixed z-50 bg-[#233138] border border-white/10 shadow-2xl py-2 rounded-md w-48 animate-in fade-in zoom-in duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                removeContact(contextMenu.userId);
                closeMenu();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-white/5 transition-colors"
            >
              <Trash2 size={16} />
              Delete Chat
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatsList;
