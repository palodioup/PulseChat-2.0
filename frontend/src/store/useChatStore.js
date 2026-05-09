import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

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
      replyTo: replyingTo ? replyingTo._id : null, // Store local link
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Add optimistic message and clear the reply box immediately
    set({ 
      messages: [...messages, optimisticMessage],
      replyingTo: null 
    });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, {
        text: messageData.text,
        image: messageData.image,
        replyTo: optimisticMessage.replyTo // Send the ID to backend
      });

      // CRITICAL: Replace temp message with server data (server must return replyTo)
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
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    
    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return;
      set({ messages: [...get().messages, newMessage] });
      if (isSoundEnabled) {
        new Audio("/sounds/notification.mp3").play().catch(() => {});
      }
    });
  },

  subscribeToContactUpdates: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
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
  removePendingRequest: (senderId) => set((state) => ({ pendingRequests: state.pendingRequests.filter(r => r.senderId !== senderId) })),
}));
