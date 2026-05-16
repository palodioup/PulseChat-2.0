import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

// --- UTILITY: CONVERT BASE64 PUBLIC VAPID KEY TO CRYPTO COMPLIANT UINT8ARRAY ---
const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// --- UTILITY: REGISTER SERVICE WORKER AND CAPTURE OFFLINE TOKEN CREDENTIALS ---
export const registerOfflinePushNotifications = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Offline push notifications are entirely unsupported by this browser engine.");
    return;
  }

  try {
    // 1. Register the worker script sitting inside your public folder
    const registration = await navigator.serviceWorker.register("/sw.js");
    
    // 2. Only request keys if the user has explicitly authorized system alerts
    if (Notification.permission === "granted") {
      // Your generated secure fallback VAPID public identifier key string
      const PUBLIC_VAPID_KEY = "BBm7vpfh2PD_LM5p4xQdA3hhPeYXUeRXhkPWEC22nrNOIwHREBoZOwpv-VWTriuwbuvyMCfMJrbzCMVrKH6skXk";
      const convertedKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);

      // Generate a fresh browser subscription envelope matching Google/Apple servers
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      console.log("Device Push Subscription Token generated:", subscription);

      // 3. Persist these secure parameter mappings straight to your user schema database
      await axiosInstance.post("/auth/update-push-subscription", subscription);
      console.log("Push credentials successfully linked to user account database context!");
    }
  } catch (error) {
    console.error("Failed to secure browser offline token elements:", error);
  }
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isOnline: navigator.onLine,
  loadingProgress: 0,
  onlineUsers: [],

  initNetworkMonitoring: () => {
    window.addEventListener("online", () => set({ isOnline: true }));
    window.addEventListener("offline", () => set({ isOnline: false }));
  },

  handleNetworkProgress: (progressEvent) => {
    if (progressEvent.total) {
      let percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
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

      const userData = res.data?.user ? res.data.user : res.data;
      set({ authUser: userData });
      get().connectSocket();
      
      // 🌟 AUTOMATIC SYNC: Ensure offline keys refresh seamlessly on session validation
      registerOfflinePushNotifications();
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ loadingProgress: 100 });
      setTimeout(() => set({ isCheckingAuth: false }), 500);
    }
  },

  signup: async (data) => {
    set({ loadingProgress: 0 }); 
    try {
      const res = await axiosInstance.post("/auth/signup", data, {
        onDownloadProgress: (event) => get().handleNetworkProgress(event),
      });
      set({ authUser: res.data, loadingProgress: 100 });
      toast.success("Account created successfully!");
      get().connectSocket();
      
      // 🌟 AUTOMATIC SYNC: Register and update token schema variables upon account creation
      registerOfflinePushNotifications();
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
      
      // 🌟 AUTOMATIC SYNC: Hook worker instance parameters into active user profile profile nodes
      registerOfflinePushNotifications();
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
