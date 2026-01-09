
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, X, Link as LinkIcon, Image as ImageIcon, Library, AlertCircle, ChevronDown, Check, MessageSquare, Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { Conversation, Message, ApprovedLink, ApprovedMedia, UserRole, ConversationStatus } from '../../types';
import { useApp } from '../../store/AppContext';
import { sendPageMessage, fetchThreadMessages } from '../../services/facebookService';

interface ChatWindowProps {
  conversation: Conversation;
  onDelete?: () => void;
}

const CachedAvatar: React.FC<{ conversation: Conversation, className?: string }> = ({ conversation, className }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (conversation.customerAvatarBlob) {
      const objectUrl = URL.createObjectURL(conversation.customerAvatarBlob);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setUrl(null);
  }, [conversation.customerAvatarBlob]);

  if (url) {
    return (
      <img 
        src={url} 
        className={className} 
        alt="" 
      />
    );
  }

  return (
    <div className={`${className} bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm uppercase overflow-hidden`}>
      {conversation.customerName.charAt(0)}
    </div>
  );
};

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onDelete }) => {
  const { currentUser, messages, addMessage, pages, approvedLinks, approvedMedia, updateConversation, deleteConversation } = useApp();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const chatMessages = useMemo(() => 
    messages
      .filter(m => m.conversationId === conversation.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  , [messages, conversation.id]);

  useEffect(() => {
    let isMounted = true;
    const syncThread = async () => {
      const page = pages.find(p => p.id === conversation.pageId);
      if (!page?.accessToken) return;

      if (chatMessages.length === 0) setIsLoadingMessages(true);
      try {
        const metaMsgs = await fetchThreadMessages(conversation.id, page.id, page.accessToken);
        if (isMounted) {
          for (const msg of metaMsgs) {
            if (!messages.find(m => m.id === msg.id)) {
              await addMessage(msg);
            }
          }
        }
      } catch (err) {
        console.error("Thread sync failed", err);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    syncThread();
    return () => { isMounted = false; };
  }, [conversation.id, pages, messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const blockRestrictedLinks = (text: string): boolean => {
    if (isAdmin) return true;
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const foundUrls = text.match(urlPattern);
    if (!foundUrls) return true;
    const libraryUrls = [
      ...approvedLinks.map(l => l.url.toLowerCase()),
      ...approvedMedia.map(m => m.url.toLowerCase())
    ];
    return foundUrls.every(url => libraryUrls.includes(url.toLowerCase()));
  };

  const handleSend = async (forcedText?: string) => {
    const textToSubmit = (forcedText || inputText).trim();
    if (!textToSubmit || isSending) return;
    
    if (!blockRestrictedLinks(textToSubmit)) {
      setLastError('Security: Only pre-approved assets allowed.');
      return;
    }

    setIsSending(true);
    setLastError(null);
    const currentPage = pages.find(p => p.id === conversation.pageId);
    
    try {
      if (currentPage && currentPage.accessToken) {
        const response = await sendPageMessage(conversation.customerId, textToSubmit, currentPage.accessToken);
        const newMessage: Message = {
          id: response.message_id || `msg-${Date.now()}`,
          conversationId: conversation.id,
          senderId: currentPage.id,
          senderName: currentPage.name,
          text: textToSubmit,
          timestamp: new Date().toISOString(),
          isIncoming: false,
          isRead: true,
        };
        await addMessage(newMessage);
      }
      if (!forcedText) setInputText('');
      setShowLibrary(false);
    } catch (err: any) {
      setLastError(err.message || 'Meta API Error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteChat = async () => {
    if (isAdmin && window.confirm("Permanently delete local chat history?")) {
      await deleteConversation(conversation.id);
      if (onDelete) onDelete();
    }
  };

  const getStatusStyle = (status: ConversationStatus) => {
    switch (status) {
      case ConversationStatus.OPEN: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ConversationStatus.PENDING: return 'bg-amber-50 text-amber-600 border-amber-100';
      case ConversationStatus.RESOLVED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const setStatus = (newStatus: ConversationStatus) => {
    updateConversation(conversation.id, { status: newStatus });
    setShowStatusMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Centered Modal Library */}
      {showLibrary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowLibrary(false)} />
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden relative z-10 animate-in zoom-in-95 duration-300 border border-slate-100">
             <div className="p-6 md:p-8 bg-slate-50/50 border-b flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                      <Library size={20} />
                   </div>
                   <span className="text-sm font-black uppercase tracking-widest text-slate-800">Compliance Asset Library</span>
                </div>
                <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
                   <X size={24} />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {approvedLinks.length > 0 && (
                    <div className="col-span-full mb-2">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Verified Links</h4>
                    </div>
                  )}
                  {approvedLinks.map(link => (
                    <button onClick={() => handleSend(link.url)} key={link.id} className="text-left p-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4 min-w-0 group bg-white">
                       <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          <LinkIcon size={18} />
                       </div>
                       <div className="truncate">
                         <p className="text-sm font-bold text-slate-700 truncate">{link.title}</p>
                         <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-tight">{link.url}</p>
                       </div>
                    </button>
                  ))}
                  
                  {approvedMedia.length > 0 && (
                    <div className="col-span-full mt-4 mb-2">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Image Assets</h4>
                    </div>
                  )}
                  {approvedMedia.map(media => (
                    <button onClick={() => handleSend(media.url)} key={media.id} className="relative aspect-video rounded-3xl overflow-hidden border-2 border-slate-50 group shadow-sm">
                       <img src={media.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                          <ImageIcon size={24} className="text-white mb-2" />
                          <span className="text-white font-black text-[10px] uppercase tracking-widest text-center">{media.title}</span>
                       </div>
                    </button>
                  ))}

                  {approvedLinks.length === 0 && approvedMedia.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center text-slate-300">
                       <ShieldAlert size={48} className="opacity-20 mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Library Empty</p>
                    </div>
                  )}
                </div>
             </div>
             
             <div className="p-6 bg-slate-50 border-t flex justify-center shrink-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Only approved assets may be dispatched via this terminal.</p>
             </div>
           </div>
        </div>
      )}

      <div className="px-4 md:px-8 py-4 md:py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl shrink-0 z-30">
        <div className="flex items-center gap-3 md:gap-4 ml-10 md:ml-0">
          <div className="relative flex-shrink-0">
            <CachedAvatar conversation={conversation} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover shadow-sm bg-slate-100" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm md:text-base truncate">{conversation.customerName}</h3>
              {isLoadingMessages && <Loader2 size={12} className="animate-spin text-blue-400" />}
            </div>
            
            <div className="relative inline-block">
              <button 
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider transition-all ${getStatusStyle(conversation.status)}`}
              >
                {conversation.status}
                <ChevronDown size={10} className="opacity-60" />
              </button>

              {showStatusMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-36 bg-white border border-slate-100 shadow-2xl rounded-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {(Object.values(ConversationStatus)).map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatus(status)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
                          conversation.status === status ? 'bg-slate-50 text-slate-900' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            status === ConversationStatus.OPEN ? 'bg-blue-500' : 
                            status === ConversationStatus.PENDING ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}></div>
                          {status}
                        </span>
                        {conversation.status === status && <Check size={10} className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <button 
            onClick={handleDeleteChat}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Purge Local Chat"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 bg-slate-50/20 custom-scrollbar">
        {chatMessages.length === 0 && !isLoadingMessages && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-4">
              <MessageSquare size={24} className="opacity-20" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Direct Conversation Active</p>
          </div>
        )}
        {isLoadingMessages && chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-blue-400/50">
            <Loader2 size={32} className="animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Pulling History from Meta...</p>
          </div>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isIncoming ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl md:rounded-3xl text-sm leading-relaxed shadow-sm ${
              msg.isIncoming 
                ? 'bg-white text-slate-700 border border-slate-100 rounded-bl-none' 
                : 'bg-blue-600 text-white shadow-blue-100 rounded-br-none'
            }`}>
              {msg.text}
            </div>
            <span className="text-[8px] font-bold text-slate-400 mt-1.5 px-1 uppercase tracking-widest">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 md:p-8 border-t border-slate-100 bg-white shrink-0">
        {lastError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl flex items-center gap-2 animate-shake border border-red-100">
            <AlertCircle size={14} /> {lastError}
          </div>
        )}

        <div className="flex items-end gap-2 md:gap-3 max-w-full">
           <button 
             onClick={() => setShowLibrary(true)}
             className={`p-3.5 md:p-4 rounded-xl md:rounded-2xl transition-all shrink-0 ${showLibrary ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-blue-50'}`}
             title="Verified Assets"
           >
             <Library size={20} />
           </button>
           <div className="flex-1 relative min-w-0">
             <textarea
               value={inputText}
               onChange={e => setInputText(e.target.value)}
               className="w-full bg-slate-50 border border-slate-100 rounded-2xl md:rounded-3xl p-3 md:p-4 text-sm md:text-base outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all resize-none max-h-32 custom-scrollbar min-h-[48px]"
               placeholder="Write a message..."
               rows={1}
               style={{ fontSize: '16px' }} // Critical to prevent iOS zoom
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
                   e.preventDefault();
                   handleSend();
                 }
               }}
             />
           </div>
           <button
             onClick={() => handleSend()}
             disabled={!inputText.trim() || isSending}
             className="p-3.5 md:p-5 bg-blue-600 text-white rounded-xl md:rounded-[24px] shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-40 transition-all flex-shrink-0"
           >
             {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
