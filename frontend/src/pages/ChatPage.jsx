import { useState } from "react";
import { Search, X, ArrowLeft, MessageSquarePlus, MoreVertical } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { activeTab, setActiveTab, selectedUser, setSelectedUser, searchQuery, setSearchQuery } = useChatStore();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    /* Main App Container: Official WhatsApp Dark Palette */
    <div className="flex h-screen w-full bg-[#111b21] text-[#e9edef] overflow-hidden selection:bg-[#00a884]/30">
      
      {/* --- LEFT SIDEBAR --- */}
      <div className={`
        ${selectedUser ? 'hidden md:flex' : 'flex'} 
        w-full md:w-[400px] flex-none flex-col border-r border-[#222d34] z-20
      `}>
        
        {/* SIDEBAR HEADER: Dynamic based on Active Tab */}
        <div className="h-[60px] bg-[#202c33] flex items-center px-4 shrink-0">
          {activeTab === "contacts" ? (
            <div className="flex items-center gap-6 animate-in slide-in-from-left-4 duration-300">
              <button 
                onClick={() => setActiveTab("chats")}
                className="text-[#aebac1] hover:text-white transition-colors"
              >

              </button>
              <h1 className="text-[#e9edef] font-medium text-lg">New Chat</h1>
            </div>
          ) : (
            <ProfileHeader />
          )}
        </div>

        {/* SEARCH BAR AREA: Live Filtering Logic */}
        <div className="p-2 bg-[#111b21] shrink-0">
          <div className={`flex items-center px-4 py-1.5 rounded-lg bg-[#202c33] border transition-all duration-200 ${isSearchFocused ? 'border-[#00a884]' : 'border-transparent'}`}>
            
            <div className="mr-4 flex items-center justify-center min-w-[24px]">
              {(isSearchFocused || searchQuery) ? (
                <button 
                  onClick={() => { setSearchQuery(""); setIsSearchFocused(false); }}
                  className="text-[#00a884] animate-in fade-in zoom-in duration-300"
                >
                  <X size={20} />
                </button>
              ) : (
                <Search size={20} className="text-[#8696a0]" />
              )}
            </div>

            <input 
              type="text" 
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => !searchQuery && setIsSearchFocused(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or start a new chat" 
              className="bg-transparent w-full text-sm outline-none text-[#d1d7db] placeholder:text-[#8696a0]"
            />

            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-[#8696a0] hover:text-white">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* TAB SWITCHER: Subtle indicator for Chats/Contacts */}
        <div className="px-2 pb-2 shrink-0">
          <ActiveTabSwitch />
        </div>

        {/* SCROLLABLE LIST: Auto-swaps between Chats and Contacts */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#111b21]">
          {activeTab === "chats" ? <ChatsList /> : <ContactList />}
        </div>
      </div>

      {/* --- RIGHT SIDE: MESSAGE AREA --- */}
      <div className={`
        ${!selectedUser ? 'hidden md:flex' : 'flex'} 
        flex-1 flex flex-col bg-[#0b141a] relative border-l border-[#222d34]
      `}>
        {selectedUser ? (
          <div className="flex flex-col h-full w-full relative">
            {/* MOBILE BACK BUTTON: Floating overlay to return to Sidebar */}
            <div className="md:hidden absolute top-[14px] left-4 z-50">
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1 text-[#aebac1] hover:bg-white/10 rounded-full transition-all"
              >

              </button>
            </div>
            
            <ChatContainer />
          </div>
        ) : (
          /* WhatsApp Landing State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 select-none">
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-full" />
              <NoConversationPlaceholder />
            </div>
      
          </div>
        )}
        
        {/* Signature WhatsApp Green Bottom Line */}
        <div className="h-1.5 w-full bg-[#00a884] absolute bottom-0 opacity-90 shadow-[0_-2px_10px_rgba(0,168,132,0.2)]" />
      </div>
    </div>
  );
}

export default ChatPage;
