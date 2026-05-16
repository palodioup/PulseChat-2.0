import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

// --- UTILITY: WORD-BOUNDARY TEXT SHORTENER ---
const compileMessagePreview = (text, maxChar = 35) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxChar) return text;

  let sub = text.substring(0, maxChar);
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > 0) sub = sub.substring(0, lastSpace);
  
  return `${sub.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\s]+$/, "")}...`;
};

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  pendingRequests: [],
  searchQuery: "",
  replyingTo: null,

  setReplyingTo: (message) => set({ replyingTo: message }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // --- SEARCH LOGIC ---
  getFilteredItems: () => {
    const { searchQuery, activeTab, allContacts, chats } = get();
    const query = searchQuery.toLowerCase().trim();
    const source = activeTab === "chats" ? chats : allContacts;
    if (!query) return source;
    return source.filter((item) => (item.fullName || "").toLowerCase().includes(query));
  },

  // --- CONTACTS & CHATS ---
  getAllContacts: async () => {
    const { handleNetworkProgress } = useAuthStore.getState();
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts", {
        onDownloadProgress: (event) => handleNetworkProgress(event),
      });
      const data = res.data?.contacts ? res.data.contacts : res.data;
      set({ allContacts: Array.isArray(data) ? data : [] });
    } catch (error) {
      toast.error("Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    const { handleNetworkProgress } = useAuthStore.getState();
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats", {
        onDownloadProgress: (event) => handleNetworkProgress(event),
      });
      const data = res.data?.chats ? res.data.chats : res.data;
      set({ chats: Array.isArray(data) ? data : [] });
    } catch (error) {
      toast.error("Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  removeContact: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/contacts/${userId}`);
      set((state) => ({
        allContacts: state.allContacts.filter((u) => u._id !== userId),
        chats: state.chats.filter((c) => c._id !== userId),
        selectedUser: state.selectedUser?._id === userId ? null : state.selectedUser
      }));
      toast.success("Contact removed");
    } catch (error) {
      toast.error("Failed to remove contact");
    }
  },

  // --- MESSAGING & REPLIES ---
  getMessagesByUserId: async (userId) => {
    const { handleNetworkProgress } = useAuthStore.getState();
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`, {
        onDownloadProgress: (event) => handleNetworkProgress(event),
      });
      set({ messages: res.data });
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, replyingTo } = get();
    const { authUser } = useAuthStore.getState();
    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      replyTo: replyingTo ? replyingTo._id : null, 
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ 
      messages: [...messages, optimisticMessage],
      replyingTo: null 
    });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, {
        text: messageData.text,
        image: messageData.image,
        replyTo: optimisticMessage.replyTo 
      });

      set((state) => ({
        messages: state.messages.map((m) => (m._id === tempId ? res.data : m))
      }));
    } catch (error) {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== tempId)
      }));
      toast.error("Failed to send message");
    }
  },

  // --- REAL-TIME LISTENERS ---
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Request native permission securely inside the background pipeline stream
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    socket.off("newMessage");
    
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, isSoundEnabled, allContacts, chats, messages } = get();
      const currentAuthUser = useAuthStore.getState().authUser;

      const isOptimisticMatch = messages.some(
        (m) => m.text === newMessage.text && m.receiverId === newMessage.receiverId && m.isOptimistic
      );
      
      if ((currentAuthUser && newMessage.senderId === currentAuthUser._id) || isOptimisticMatch) {
        return;
      }
      
      // 🟢 CASE A: Message arrives for the current conversation open on screen
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        const isDuplicate = messages.some((m) => m._id === newMessage._id);
        if (!isDuplicate) {
          set({ messages: [...get().messages, newMessage] }); 
        }
        if (isSoundEnabled) {
          new Audio("/sounds/notification.mp3").play().catch(() => {});
        }
        return; 
      }

      // 🔵 CASE B: Message arrives in the background from a different contact channel
      const sender = [...allContacts, ...chats].find((u) => u._id === newMessage.senderId);
      const senderName = sender?.fullName || "PulseChat User";

      let previewText = newMessage.image 
        ? "📷 Sent an image attachment" 
        : compileMessagePreview(newMessage.text, 35);

      // 🌟 NATIVE DESKTOP ALERT DISPATCHER LAYER
      // Fire a system window banner ONLY if the user is looking away or minimized!
      if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        try {
          const sysNotification = new Notification(`New Message from ${senderName}`, {
            body: previewText,
            icon: "/logo192.png", // Ensure this fallback asset file maps to public folder root
            tag: "pulsechat-background-msg" // Merges consecutive message stacks cleanly
          });

          sysNotification.onclick = () => {
            window.focus();
            if (sender) set({ selectedUser: sender });
          };
        } catch (e) {
          console.error("OS Level banner rejected layout render:", e);
        }
      } else {
        // Fallback UI toast if the user has the browser window open right in front of them
        toast(`${senderName}: ${previewText}`, {
          icon: '💬',
          duration: 4000,
          position: 'bottom-right'
        });
      }

      if (isSoundEnabled) {
        new Audio("/sounds/notification.mp3").play().catch(() => {});
      }
    });
  },

  subscribeToContactUpdates: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    socket.off("contact_removed");

    socket.on("contact_removed", (data) => {
      const { userId, userName } = data;
      set((state) => ({
        allContacts: state.allContacts.filter((u) => u._id !== userId),
        chats: state.chats.filter((c) => c._id !== userId),
        selectedUser: state.selectedUser?._id === userId ? null : state.selectedUser
      }));
      toast(`${userName} removed you`, { icon: '🗑️' });
    });
  },

  unsubscribeFromContactUpdates: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.off("contact_removed");
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.off("newMessage");
  },

  // --- UI UTILS ---
  toggleSound: () => {
    const newVal = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", newVal);
    set({ isSoundEnabled: newVal });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  addContact: (userData) => set((state) => ({
    allContacts: state.allContacts.some(u => u._id === userData._id) ? state.allContacts : [...state.allContacts, userData]
  })),
  setContacts: (contacts) => set({ allContacts: contacts || [] }),
  addPendingRequest: (request) => set((state) => ({ pendingRequests: [...state.pendingRequests, request] })),
  removePendingRequest: (senderId) => set((state) => ({ 
    pendingRequests: state.pendingRequests.filter(r => r.senderId !== senderId) 
  })),
}));
