import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { UserPlus, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddContact() {
  const [email, setEmail] = useState('');
  const { addContact } = useChatStore();
  const socket = useAuthStore((state) => state.socket);

  useEffect(() => {
    if (!socket) return;

    socket.on('contact_added_successfully', (userData) => {
      addContact(userData);
      toast.success(`Added ${userData.fullName}`);
    });

    socket.on('error_message', (msg) => toast.error(msg));

    return () => {
      socket.off('contact_added_successfully');
      socket.off('error_message');
    };
  }, [socket, addContact]);

  const handleAdd = () => {
    if (!socket || !socket.connected) {
      return toast.error("Wait for connection...");
    }

    if (email.includes("@")) {
      socket.emit("send_friend_request", email.trim().toLowerCase());
      setEmail("");
    } else {
      toast.error("Invalid email");
    }
  };

  return (
    <div className="p-4 bg-[#111b21] border-t border-white/5 mt-auto">
      <div className="flex flex-col gap-2">
        <label className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-2">
          <UserPlus size={12} />
          New Connection
        </label>
        
        <div className="flex items-center bg-[#202c33] rounded-xl px-3 py-1 border border-transparent focus-within:border-white/20 transition-all">
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Friend's email..."
            className="bg-transparent flex-1 py-2 text-sm text-[#e9edef] outline-none placeholder:text-zinc-600"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          
          <button 
            onClick={handleAdd} 
            className="p-2 text-white hover:bg-white/5 rounded-full transition-colors active:scale-95"
            title="Send Request"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
