import { useState, useRef } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon, Camera } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const mouseClickSound = new Audio("/m.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile, onlineUsers } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);

  // REAL-TIME SOCKET CHECK
  const isMeOnline = (onlineUsers || []).includes(authUser?._id);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 5) {
      alert("File too large! Keep it under 5MB.");
      return;
    }

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
      {/* LEFT: AVATAR, NAME, & SOCKET STATUS */}
      <div className="flex items-center gap-3">
        <div 
          className="relative cursor-pointer group"
          onClick={() => fileInputRef.current.click()}
        >
          <img
            src={selectedImg || authUser?.profilePic || "/avatar.png"}
            className="size-10 rounded-full object-cover border border-white/5"
            alt="User profile"
          />
          
          {/* Real-time Socket Online Dot */}
          {isMeOnline && (
            <span className="absolute bottom-0 right-0 size-3 bg-[#00a884] border-2 border-[#202c33] rounded-full" />
          )}

          {/* Hover Overlay for Camera */}
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={14} className="text-white" />
          </div>
          
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
        </div>

        <div className="flex flex-col">
          <span className="text-[15px] font-medium text-[#e9edef] leading-tight truncate max-w-[140px]">
            {authUser?.fullName || "My Profile"}
          </span>
          <span className={`text-[11px] font-medium uppercase tracking-wider ${isMeOnline ? 'text-[#00a884]' : 'text-zinc-500'}`}>
            {isMeOnline ? "Online" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* RIGHT: ACTION ICONS */}
      <div className="flex items-center gap-1 text-[#aebac1]">
        <button 
          onClick={handleToggleSound} 
          title="Toggle Notifications"
          className="p-2 hover:bg-[#3b4a54] rounded-full transition-colors active:bg-[#2a3942]"
        >
          {isSoundEnabled ? <Volume2Icon size={20} /> : <VolumeOffIcon size={20} />}
        </button>

        <button 
          onClick={logout} 
          title="Logout"
          className="p-2 hover:bg-[#3b4a54] rounded-full transition-colors text-red-400/70 hover:text-red-400"
        >
          <LogOutIcon size={20} />
        </button>
      </div>
    </div>
  );
}

export default ProfileHeader;
