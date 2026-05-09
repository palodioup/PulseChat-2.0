import { useState, useRef, useEffect } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon, Download, Camera } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const mouseClickSound = new Audio("/m.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile, onlineUsers } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);

  // --- PWA INSTALL LOGIC ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Prevent Chrome from showing its own prompt
      setDeferredPrompt(e); // Save the event so we can trigger it later
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // --- IDENTITY LOGIC ---
  const isMeOnline = (onlineUsers || []).includes(authUser?._id);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleToggleSound = () => {
    mouseClickSound.currentTime = 0;
    mouseClickSound.play().catch(() => {});
    toggleSound();
  };

  return (
    <div className="flex items-center justify-between w-full h-full bg-[#202c33]">
      {/* LEFT: AVATAR & STATUS */}
      <div className="flex items-center gap-3">
        <div className="relative cursor-pointer group" onClick={() => fileInputRef.current.click()}>
          <img
            src={selectedImg || authUser?.profilePic || "/avatar.png"}
            className="size-10 rounded-full object-cover border border-white/5"
            alt="Profile"
          />
          {isMeOnline && (
            <span className="absolute bottom-0 right-0 size-3 bg-[#00a884] border-2 border-[#202c33] rounded-full" />
          )}
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={14} className="text-white" />
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
        </div>

        <div className="flex flex-col">
          <span className="text-[15px] font-medium text-[#e9edef] leading-tight truncate max-w-[120px]">
            {authUser?.fullName || "My Profile"}
          </span>
          <span className={`text-[11px] font-medium uppercase tracking-wider ${isMeOnline ? 'text-[#00a884]' : 'text-zinc-500'}`}>
            {isMeOnline ? "Online" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* RIGHT: ACTION ICONS */}
      <div className="flex items-center gap-1 text-[#aebac1]">
        
        {/* INSTALL APP BUTTON (Only shows when installable) */}
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="p-2 text-[#00a884] hover:bg-[#3b4a54] rounded-full animate-pulse"
            title="Install App"
          >
            <Download size={20} />
          </button>
        )}

        <button onClick={handleToggleSound} className="p-2 hover:bg-[#3b4a54] rounded-full">
          {isSoundEnabled ? <Volume2Icon size={20} /> : <VolumeOffIcon size={20} />}
        </button>

        <button onClick={logout} className="p-2 hover:bg-[#3b4a54] rounded-full text-red-400/70 hover:text-red-400">
          <LogOutIcon size={20} />
        </button>
      </div>
    </div>
  );
}

export default ProfileHeader;
