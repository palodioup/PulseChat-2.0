import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isOnline: navigator.onLine,
  loadingProgress: 0,

  initNetworkMonitoring: () => {
    window.addEventListener("online", () => set({ isOnline: true }));
    window.addEventListener("offline", () => set({ isOnline: false }));
  },

  // Tracks the real byte-by-byte progress of the download
  handleNetworkProgress: (progressEvent) => {
    if (progressEvent.total) {
      // Calculate the raw percentage
      let percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      
      // FIX: Clamp the value so it never goes above 100 or below 0
      percentage = Math.max(0, Math.min(100, percentage));
      
      set({ loadingProgress: percentage });
    }
  },



    checkAuth: async () => {
    set({ loadingProgress: 0, isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check", {
        onDownloadProgress: (event) => get().handleNetworkProgress(event),
      });

      // If the middleware wrapped your user, extract it. 
      // This ensures authUser is ALWAYS the actual user object.
      const userData = res.data?.user ? res.data.user : res.data;
      
      set({ authUser: userData });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ loadingProgress: 100 });
      setTimeout(() => set({ isCheckingAuth: false }), 500);
    }
  },

  signup: async (data) => {
    set({ loadingProgress: 0 }); // Optional: could show bar for large user objects
    try {
      const res = await axiosInstance.post("/auth/signup", data, {
        onDownloadProgress: (event) => get().handleNetworkProgress(event),
      });
      set({ authUser: res.data, loadingProgress: 100 });
      toast.success("Account created successfully!");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true, loadingProgress: 0 });
    try {
      const res = await axiosInstance.post("/auth/login", data, {
        onDownloadProgress: (event) => get().handleNetworkProgress(event),
      });
      set({ authUser: res.data, loadingProgress: 100 });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Error logging out");
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      withCredentials: true,
      transports: ["websocket"], 
      query: { userId: authUser._id },
    });

    socket.connect();
    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
      set({ socket: null });
    }
  },
}));
