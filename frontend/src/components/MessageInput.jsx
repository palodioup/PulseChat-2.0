import { useRef, useState, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, X, CornerDownRight } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null); // Ref to focus the input

  const { authUser } = useAuthStore();
  const { sendMessage, isSoundEnabled, replyingTo, setReplyingTo } = useChatStore();

  // Automatically focus the input when you start a reply
  useEffect(() => {
    if (replyingTo) {
      textInputRef.current?.focus();
    }
  }, [replyingTo]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    sendMessage({
      text: text.trim(),
      image: imagePreview,
    });
    
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full bg-[#202c33] p-2 flex flex-col gap-1 border-t border-white/5">
      
      {/* 1. REPLY PREVIEW BOX */}
      {replyingTo && (
        <div className="mx-2 bg-[#1c272d] border-l-4 border-[#00a884] rounded-md p-3 flex justify-between items-start animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex gap-3 items-center overflow-hidden">
            <div className="text-[#00a884]">
               <CornerDownRight size={16} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs text-[#00a884] font-medium mb-0.5">
                {replyingTo.senderId === authUser?._id ? "You" : "Contact"}
              </span>
              <p className="text-[#8696a0] text-sm truncate max-w-[300px] md:max-w-md">
                {replyingTo.image ? "📷 Photo" : replyingTo.text}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setReplyingTo(null)}
            className="text-[#8696a0] hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* 2. IMAGE PREVIEW BOX */}
      {imagePreview && (
        <div className="mx-2 mb-2 relative inline-block w-fit">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-24 h-24 object-cover rounded-lg border border-white/10"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#202c33] flex items-center justify-center text-white border border-white/10 shadow-lg"
            type="button"
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* 3. MAIN INPUT BAR */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 px-2 h-[52px]">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 transition-colors ${imagePreview ? "text-[#00a884]" : "text-[#8696a0] hover:text-[#d1d7db]"}`}
        >
          <ImageIcon size={26} />
        </button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <div className="flex-1 bg-[#2a3942] rounded-xl px-4 py-2.5 flex items-center">
          <input
            ref={textInputRef} // Added ref to allow auto-focus
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              isSoundEnabled && playRandomKeyStrokeSound();
            }}
            className="w-full bg-transparent text-[#d1d7db] outline-none text-[15px] placeholder:text-[#8696a0]"
            placeholder="Type a message"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className={`p-2 transition-transform active:scale-90 ${
            text.trim() || imagePreview ? "text-[#00a884]" : "text-[#8696a0]"
          }`}
        >
          <SendIcon size={26} fill="currentColor" className="opacity-90" />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
