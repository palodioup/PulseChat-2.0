import React, { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

export default function RequestNotifications() {
  const socket = useAuthStore((state) => state.socket);
  const { addContact } = useChatStore();

  useEffect(() => {
    if (!socket) return;

    // 1. LISTEN: When someone sends John/Doe a request
    socket.on("receive_friend_request", (data) => {
      toast((t) => (
        <div className="flex flex-col gap-3 p-1">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
              {data.senderName?.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm">
              <span className="font-bold">{data.senderName}</span> wants to connect!
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button 
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-md transition-colors"
              onClick={() => {
                socket.emit("respond_to_request", { senderId: data.senderId, status: "accepted" });
                toast.dismiss(t.id);
              }}
            >
              Accept
            </button>
            <button 
              className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium rounded-md transition-colors"
              onClick={() => {
                socket.emit("respond_to_request", { senderId: data.senderId, status: "rejected" });
                toast.dismiss(t.id);
              }}
            >
              Reject
            </button>
          </div>
        </div>
      ), { 
        duration: 10000,
        position: "top-right",
        style: { background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }
      });
    });

    // 2. LISTEN: When a request is finalized (Accepted/Rejected)
    socket.on("friend_request_finalized", (data) => {
      if (data.status === "accepted") {
        toast.success(data.message);
      } else if (data.status === "rejected") {
        toast.error(data.message);
      }
    });

    // 3. LISTEN: The actual user object to add to the Sidebar UI
    socket.on("contact_added_successfully", (newUser) => {
      addContact(newUser); // This makes the user appear in the sidebar instantly
    });

    return () => {
      socket.off("receive_friend_request");
      socket.off("friend_request_finalized");
      socket.off("contact_added_successfully");
    };
  }, [socket, addContact]);

  return null; // This component runs in the background
}
