import React, { useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from "react-router-dom";
import ChatPage from './pages/ChatPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import { useAuthStore } from './store/useAuthStore.js';
import { useChatStore } from './store/useChatStore.js';
import { Toaster } from 'react-hot-toast';
import RequestNotifications from './components/RequestNotifications.jsx';
import {LoadingOverlay} from './components/LoadingOverlay.jsx';

export default function App() {
  const { checkAuth, authUser, isOnline, initNetworkMonitoring, socket } = useAuthStore();
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
      }
    };

    initApp();
  }, [checkAuth, getAllContacts, initNetworkMonitoring]);

  // 2. Real-time Socket Listeners (NO REFRESH NEEDED)
  useEffect(() => {
    if (authUser && socket) {
      // Start listening for new messages and contact removals instantly
      subscribeToMessages();
      subscribeToContactUpdates();
    }

    return () => {
      // Clean up listeners when logging out or closing app
      unsubscribeFromMessages();
      unsubscribeFromContactUpdates();
    };
  }, [authUser, socket, subscribeToMessages, unsubscribeFromMessages, subscribeToContactUpdates, unsubscribeFromContactUpdates]);

  return (
    /* Main Layout: Pure Monochrome */
    <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-[#00a884]/30">
      
      {/* Background Grid Pattern (Optional) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: '32px 32px' }} 
      />

      {/* Logic Overlays */}
      <LoadingOverlay />
      {authUser && <RequestNotifications />}

      {/* 3. Main Viewport */}
      <div className="relative z-10 min-h-screen w-full flex flex-col">
        <Routes>
          <Route path="/" element={authUser ? <ChatPage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        </Routes>
      </div>

      {/* Styled Toaster to match WhatsApp Dark theme */}
      <Toaster 
        position="bottom-right" 
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
