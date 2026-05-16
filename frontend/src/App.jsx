import React, { useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from "react-router-dom";
import ChatPage from './pages/ChatPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import { useAuthStore, registerOfflinePushNotifications } from './store/useAuthStore.js'; // 🌟 Imported the secure token helper here
import Home from "./pages/Home.jsx"
import { useChatStore } from './store/useChatStore.js';
import { Toaster } from 'react-hot-toast'; 
import RequestNotifications from './components/RequestNotifications.jsx';
import { LoadingOverlay } from './components/LoadingOverlay.jsx';

export default function App() {
  const { checkAuth, authUser, isCheckingAuth, initNetworkMonitoring, socket } = useAuthStore();
  const { 
    getAllContacts, 
    subscribeToMessages, 
    unsubscribeFromMessages,
    subscribeToContactUpdates,
    unsubscribeFromContactUpdates
  } = useChatStore();
  
  const isInitialized = useRef(false);

  // 1. Initial Boot Logic
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initApp = async () => {
      initNetworkMonitoring();
      await checkAuth(); 
      
      const currentAuthUser = useAuthStore.getState().authUser;
      if (currentAuthUser) {
        await getAllContacts();
        
        // 🌟 AUTOMATIC OFFLINE INITIALIZATION:
        // Registers the public/sw.js worker file and pushes the browser's crypto tokens to your DB
        registerOfflinePushNotifications(); 
      }
    };

    initApp();
  }, [checkAuth, getAllContacts, initNetworkMonitoring]);

  // 2. Real-time Socket Listeners (Online foreground/background handling)
  useEffect(() => {
    if (authUser && socket && socket.connected) {
      subscribeToMessages();
      subscribeToContactUpdates();
    }

    return () => {
      unsubscribeFromMessages();
      unsubscribeFromContactUpdates();
    };
  }, [
    authUser, 
    socket, 
    socket?.connected, 
    subscribeToMessages, 
    unsubscribeFromMessages, 
    subscribeToContactUpdates, 
    unsubscribeFromContactUpdates
  ]);

  if (isCheckingAuth && !authUser) return <LoadingOverlay />;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-[#00a884]/30">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: '32px 32px' }} 
      />

      {/* Logic Overlays */}
      <LoadingOverlay />
      {authUser && <RequestNotifications />}

      {/* Main Viewport */}
      <div className="relative z-10 min-h-screen w-full flex flex-col">
        <Routes>
          <Route path="/" element={authUser ? <ChatPage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/home" element={<Home/>}/>
        </Routes>
      </div>

      <Toaster 
        position="bottom-right" 
        containerStyle={{
          zIndex: 9999999 // Overwrites absolutely positioned dark panels
        }}
        toastOptions={{
          style: {
            background: '#202c33',
            color: '#e9edef',
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: '14px'
          },
        }}
      />
    </div>
  );
}
