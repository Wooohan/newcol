
import React, { useState, useEffect } from 'react';
import { Search, MessageSquareOff, Facebook, ChevronLeft, RefreshCw, Loader2, Zap } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Conversation, ConversationStatus, UserRole } from '../../types';
import ChatWindow from './ChatWindow';

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
    <div className={`${className} bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs uppercase overflow-hidden`}>
      {conversation.customerName.charAt(0)}
    </div>
  );
};

const InboxView: React.FC = () => {
  const { conversations, currentUser, pages, syncMetaConversations, isHistorySynced } = useApp();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ConversationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const activeConv = conversations.find(c => c.id === activeConvId) || null;

  const handleSync = async () => {
    setIsSyncing(true);
    await syncMetaConversations();
    setIsSyncing(false);
  };

  const visibleConversations = conversations.filter(conv => {
    const page = pages.find(p => p.id === conv.pageId);
    const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
    const isAssignedToPage = (page?.assignedAgentIds || []).includes(currentUser?.id || '');
    
    if (!isAdmin && !isAssignedToPage) return false;
    
    const matchesFilter = filter === 'ALL' || conv.status === filter;
    const matchesSearch = conv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case ConversationStatus.OPEN: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ConversationStatus.PENDING: return 'bg-amber-50 text-amber-600 border-amber-100';
      case ConversationStatus.RESOLVED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="flex h-[calc(100vh-40px)] bg-white overflow-hidden rounded-3xl md:rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative max-w-full">
      {/* Sidebar List - Hidden on mobile if chat is active */}
      <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/30 transition-all shrink-0 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 md:p-6 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Messages</h2>
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[9px] font-black rounded-lg uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-100"
            >
              {isSyncing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
              {isSyncing ? 'Syncing...' : 'Sync Meta'}
            </button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search chats..."
              style={{ fontSize: '16px' }} // Prevent mobile zoom
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar shrink-0">
            {(['ALL', ConversationStatus.OPEN, ConversationStatus.PENDING, ConversationStatus.RESOLVED] as const).map((stat) => (
              <button
                key={stat}
                onClick={() => setFilter(stat)}
                className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex-shrink-0 border ${
                  filter === stat 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                }`}
              >
                {stat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 md:px-4 pb-8 space-y-2">
          {!isHistorySynced && (
             <div className="mx-2 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                <Zap size={14} className="text-blue-600 shrink-0" />
                <p className="text-[9px] font-bold text-blue-700 uppercase tracking-tight">Real-Time Mode Active</p>
             </div>
          )}
          
          {visibleConversations.length > 0 ? (
            visibleConversations.map((conv) => {
              const page = pages.find(p => p.id === conv.pageId);
              const isActive = activeConv?.id === conv.id;
              
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left p-3 md:p-4 rounded-2xl md:rounded-[28px] transition-all border relative group min-w-0 ${
                    isActive 
                      ? 'bg-white border-blue-500 shadow-xl shadow-blue-100/50 ring-4 ring-blue-50' 
                      : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <CachedAvatar conversation={conv} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl shadow-sm object-cover" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Facebook size={10} className="text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className={`font-bold truncate text-sm transition-colors ${isActive ? 'text-blue-600' : 'text-slate-800'}`}>
                          {conv.customerName}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 flex-shrink-0 ml-2">
                          {new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs truncate text-slate-500 mb-2">{conv.lastMessage}</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border shrink-0 ${getStatusColor(conv.status)}`}>
                          {conv.status}
                        </span>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-lg truncate max-w-[100px]">
                           {page?.name || 'Page'}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <MessageSquareOff size={32} className="opacity-20 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center px-4">Waiting for new activity...</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat View - Full width on mobile when active */}
      <div className={`flex-1 bg-white relative min-w-0 ${!activeConvId ? 'hidden md:flex' : 'flex h-full w-full'}`}>
        {activeConv ? (
          <div className="flex flex-col w-full h-full min-w-0">
            {/* Back button only on mobile */}
            <button 
              onClick={() => setActiveConvId(null)}
              className="md:hidden absolute top-5 left-4 z-50 p-2 bg-slate-100 text-slate-600 rounded-full shadow-sm active:scale-95 transition-transform"
            >
              <ChevronLeft size={20} />
            </button>
            <ChatWindow conversation={activeConv} onDelete={() => setActiveConvId(null)} />
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 p-8 text-center bg-slate-50/20">
             <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mb-6 shadow-sm border border-slate-100">
               <MessageSquareOff size={32} className="text-slate-200" />
             </div>
             <h3 className="text-slate-800 font-bold mb-2">Select a Conversation</h3>
             <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
               Choose a chat from the left sidebar to start communicating with customers in real-time.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxView;
