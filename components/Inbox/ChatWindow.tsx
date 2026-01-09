import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, X, Link as LinkIcon, Image as ImageIcon, Library, AlertCircle, ChevronDown, Check, MessageSquare, Loader2, Trash2, ShieldAlert, Clock, Info, Zap } from 'lucide-react';
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
      <img src={url} className={className} alt="" />
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
  const [lastError, setLastError] = useState<{message: string, isPolicy?: boolean} | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadPollRef = useRef<number | null>(null);
  const sentMessageIds = useRef<Set<string>>(new Set());

  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const isWindowExpired = useMemo(() => {
    const lastTime = new Date(conversation.lastTimestamp).getTime();
    const now = new Date().getTime();
    return (now - lastTime) > (24 * 60 * 60 * 1000);
  }, [conversation.lastTimestamp]);

  const chatMessages = useMemo(() => 
    messages
      .filter(m => m.conversationId === conversation.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  , [messages, conversation.id]);

  // ULTRA HIGH-FREQUENCY FOCUSED POLLING (500ms for active session)
  useEffect(() => {
    let isMounted = true;
    let pollInterval = 500; // 0.5 seconds for instant feel
    
    const syncThread = async () => {
      const page = pages.find(p => p.id === conversation.pageId);
      if (!page?.accessToken) return;

      try {
        const metaMsgs = await fetchThreadMessages(conversation.id, page.id, page.accessToken);
        if (isMounted) {
          const newMsgs = metaMsgs.filter(m => !messages.find(existing => existing.id === m.id));
          if (newMsgs.length > 0) {
            for (const msg of newMsgs) {
              await addMessage(msg);
            }
          }
        }
      } catch (err) {
        // Silent backoff on error
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    if (chatMessages.length === 0) setIsLoadingMessages(true);
    syncThread();

    // Turbo poll specifically for the open chat
    threadPollRef.current = window.setInterval(syncThread, pollInterval);

    return () => { 
      isMounted = false; 
      if (threadPollRef.current) clearInterval(threadPollRef.current);
    };
  }, [conversation.id, pages, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const validateMessageContent = (text: string): boolean => {
    // Check if message contains URLs (not from approved links)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    
    if (urls.length > 0) {
      const approvedUrls = approvedLinks.map(link => link.url);
      const hasUnapprovedUrl = urls.some(url => !approvedUrls.includes(url));
      
      if (hasUnapprovedUrl) {
        setShowRestrictedPopup(true);
        return false;
      }
    }
    
    return true;
  };

  const handleSend = async (forcedText?: string) => {
    const textToSubmit = (forcedText || inputText).trim();
    if (!textToSubmit || isSending) return;
    
    // Validate content if not from approved library
    if (!forcedText && !validateMessageContent(textToSubmit)) {
      return;
    }

    const currentPage = pages.find(p => p.id === conversation.pageId);
    if (!currentPage || !currentPage.accessToken) {
      setLastError({ message: 'Page not connected' });
      return;
    }

    // Check if window is expired
    if (isWindowExpired) {
      setLastError({ 
        message: 'This conversation is older than 24 hours. You can only send messages with the HUMAN_AGENT tag. Facebook may restrict this.',
        isPolicy: true 
      });
    }

    // Generate unique message ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if we already sent this message (prevent duplicates)
    if (sentMessageIds.current.has(tempId)) {
      return;
    }
    sentMessageIds.current.add(tempId);

    // OPTIMISTIC UI: Add to state instantly
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUser?.id || 'agent',
      senderName: currentUser?.name || 'Agent',
      text: textToSubmit,
      timestamp: new Date().toISOString(),
      isIncoming: false,
      isRead: true,
    };
    
    addMessage(optimisticMessage);
    setIsSending(true);
    setLastError(null);
    
    try {
      const tag = isWindowExpired ? "HUMAN_AGENT" : undefined;
      const response = await sendPageMessage(conversation.customerId, textToSubmit, currentPage.accessToken, tag);
      
      // Update the optimistic message with real Meta ID if available
      if (response.message_id) {
        // Remove temp message and add real one
        const realMessage: Message = {
          ...optimisticMessage,
          id: response.message_id
        };
        await addMessage(realMessage);
      }
      
      if (!forcedText) setInputText('');
      setShowLibrary(false);
    } catch (err: any) {
      // Remove optimistic message on error
      sentMessageIds.current.delete(tempId);
      
      if (err.code === 10900 || err.message?.includes('24 hour')) {
        setLastError({ 
          message: 'Cannot send message: 24-hour messaging window has expired. You need to wait for the customer to message you first, or use a message tag.',
          isPolicy: true 
        });
      } else {
        setLastError({ message: err.message || 'Failed to send message' });
      }
    } finally {
      setIsSending(false);
    }
  };

  const setStatus = (newStatus: ConversationStatus) => {
    updateConversation(conversation.id, { status: newStatus });
    setShowStatusMenu(false);
  };

  const getStatusStyle = (status: ConversationStatus) => {
    switch (status) {
      case ConversationStatus.OPEN: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ConversationStatus.PENDING: return 'bg-amber-50 text-amber-600 border-amber-100';
      case ConversationStatus.RESOLVED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {showRestrictedPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRestrictedPopup(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 animate-in zoom-in-95 duration-300 border border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Content Restricted</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              You can only send links and media that have been approved by the administrator. Please use the library button to access approved content.
            </p>
            <button 
              onClick={() => setShowRestrictedPopup(false)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showLibrary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowLibrary(false)} />
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden relative z-10 animate-in zoom-in-95 duration-300 border border-slate-100">
             <div className="p-6 md:p-8 bg-slate-50/50 border-b flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                      <Library size={20} />
                   </div>
                   <span className="text-sm font-black uppercase tracking-widest text-slate-800">Approved Content</span>
                </div>
                <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
                   <X size={24} />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {approvedMedia.map(media => (
                    <button onClick={() => handleSend(media.url)} key={media.id} className="relative aspect-video rounded-3xl overflow-hidden border-2 border-slate-50 group shadow-sm">
                       <img src={media.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                          <ImageIcon size={24} className="text-white mb-2" />
                          <span className="text-white font-black text-[10px] uppercase tracking-widest text-center">{media.title}</span>
                       </div>
                    </button>
                  ))}
                </div>
             </div>
           </div>
        </div>
      )}

      <div className="px-4 md:px-8 py-4 md:py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl shrink-0 z-30">
        <div className="flex items-center gap-3 md:gap-4 ml-10 md:ml-0 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <CachedAvatar conversation={conversation} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover shadow-sm bg-slate-100" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm md:text-base truncate">{conversation.customerName}</h3>
              {isLoadingMessages && <Loader2 size={12} className="animate-spin text-blue-400 flex-shrink-0" />}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
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
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider flex items-center gap-1 bg-emerald-50 text-emerald-600 border-emerald-100`}>
                <Zap size={8} className="animate-pulse" />
                Live
              </div>
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => {
              if (window.confirm("Archive local chat view?")) deleteConversation(conversation.id).then(() => onDelete?.());
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 bg-slate-50/20 custom-scrollbar">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isIncoming ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl md:rounded-3xl text-sm leading-relaxed shadow-sm break-words ${
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

      {lastError && (
        <div className={`mx-4 md:mx-8 mb-4 p-3 rounded-xl flex items-start gap-3 text-xs ${
          lastError.isPolicy ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold mb-1">{lastError.isPolicy ? 'Policy Restriction' : 'Error'}</p>
            <p className="text-[11px] leading-relaxed">{lastError.message}</p>
          </div>
          <button onClick={() => setLastError(null)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="p-4 md:p-8 border-t border-slate-100 bg-white shrink-0">
        <div className="flex items-end gap-2 md:gap-3 max-w-full">
           <button 
             onClick={() => setShowLibrary(true)}
             className={`p-3.5 md:p-4 rounded-xl md:rounded-2xl transition-all shrink-0 ${showLibrary ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-blue-50'}`}
           >
             <Library size={20} />
           </button>
           <div className="flex-1 relative min-w-0">
             <textarea
               value={inputText}
               onChange={e => setInputText(e.target.value)}
               className="w-full bg-slate-50 border border-slate-100 rounded-2xl md:rounded-3xl p-3 md:p-4 text-sm md:text-base outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all resize-none min-h-[56px] max-h-[120px] custom-scrollbar"
               placeholder="Type your message..."
               rows={1}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSend();
                 }
               }}
             />
           </div>
           <button 
             onClick={() => handleSend()}
             disabled={isSending || !inputText.trim()}
             className="p-3.5 md:p-4 bg-blue-600 text-white rounded-xl md:rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:grayscale shrink-0 shadow-lg shadow-blue-100 active:scale-95"
           >
             {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
