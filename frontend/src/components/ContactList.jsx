import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import AddContact from "./AddContact";
import { Trash2 } from "lucide-react";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading, removeContact, getFilteredItems, searchQuery } = useChatStore();
  const { onlineUsers } = useAuthStore();
  
  // Local state for the context menu
  const [contextMenu, setContextMenu] = useState(null); // { x: 0, y: 0, userId: null }
  const filteredItems = getFilteredItems();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

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

  const filteredContacts = getFilteredItems();

  return (
    <div className="relative">
      {filteredContacts.map((contact) => (
        <div
          key={contact._id}
          onContextMenu={(e) => handleContextMenu(e, contact._id)}
          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#202c33] transition-colors border-b border-white/5"
          onClick={() => setSelectedUser(contact)}
        >
          {/* AVATAR */}
          <div className="relative">
            <div className="size-12 rounded-full overflow-hidden border border-white/5">
              <img src={contact.profilePic || "/avatar.png"} className="object-cover w-full h-full" />
            </div>
            {onlineUsers.includes(contact._id) && (
              <span className="absolute bottom-0 right-0 size-3 bg-[#00a884] border-2 border-[#111b21] rounded-full" />
            )}
          </div>

          {/* NAME */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[#e9edef] font-medium truncate">{contact.fullName}</h4>
            <p className="text-zinc-500 text-xs truncate">
              {onlineUsers.includes(contact._id) ? "Available" : "Offline"}
            </p>
          </div>
        </div>
      ))}

      <AddContact />

      

      {/* CONTEXT MENU OVERLAY */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu on click anywhere else */}
          <div className="fixed inset-0 z-40" onClick={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu(); }} />
          
          {/* The Menu */}
          <div 
            className="fixed z-50 bg-[#233138] border border-white/10 shadow-2xl py-2 rounded-md w-48 animate-in fade-in zoom-in duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button 
              onClick={() => { removeContact(contextMenu.userId); closeMenu(); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-white/5 transition-colors"
            >
              <Trash2 size={16} />
              Delete Contact
            </button>
          </div>
        </>
      )}

            
    </div>
  );
}

export default ContactList;
