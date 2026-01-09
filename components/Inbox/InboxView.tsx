
import React, { useState, useEffect } from 'react';
import { Search, MessageSquareOff, Facebook, ChevronLeft, RefreshCw, Loader2, Zap, History, Clock } from 'lucide-react';
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
      <img src={url} className={className} alt="" />
    );
  }

  return (
    <div className={`${className} bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs uppercase overflow-hidden`}>
      {conversation.customerName.charAt(0)}
    </div>
  );
};

const InboxView: React.FC = () => {
  const { conversations, currentUser, pages, syncMetaConversations, syncFullHistory, lastSyncTime, isPolling } = useApp();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ConversationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeepSyncing, setIsDeepSyncing] = useState(false);

  const activeConv = conversations.find(c => c.id === activeConvId) || null;

  const handleQuickSync = () => {
    // Only fetch top 5 manually too for speed
    syncMetaConversations(5);
  };

  const handleDeepSync = async () => {
    setIsDeepSyncing(true);
    await syncFullHistory();
    setIsDeepSyncing(false);
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
      {/* Sidebar List */}
      <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/30 transition-all shrink-0 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 md:p-6 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inbox</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isPolling ? 'bg-blue-500 animate-ping' : 'bg-emerald-500'}`}></div>
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                  {isPolling ? 'Syncing...' : lastSyncTime ? `Live • ${lastSyncTime}` : 'Connecting...'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleQuickSync}
                disabled={isPolling}
                title="Quick Refresh (Top 5)"
                className="p-2 bg-white border border-slate-200 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90 disabled:opacity-50"
              >
                {isPolling ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              </button>
              <button 
                onClick={handleDeepSync}
                disabled={isDeepSyncing}
                title="Sync All History"
                className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90 disabled:opacity-50"
              >
                {isDeepSyncing ? <Loader2 size={16} className="animate-spin" /> : <History size={16} />}
              </button>
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search customers..."
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
          {visibleConversations.length > 0 ? (
            visibleConversations.map((conv) => {
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
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className={`font-bold truncate text-sm transition-colors ${isActive ? 'text-blue-600' : 'text-slate-800'}`}>
                          {conv.customerName}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 flex-shrink-0 ml-2 uppercase">
                          {new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] truncate text-slate-500 mb-2 font-medium">{conv.lastMessage}</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border shrink-0 ${getStatusColor(conv.status)}`}>
                          {conv.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <MessageSquareOff size={32} className="opacity-20 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center px-4">No conversations</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat View */}
      <div className={`flex-1 bg-white relative min-w-0 ${!activeConvId ? 'hidden md:flex' : 'flex h-full w-full'}`}>
        {activeConv ? (
          <div className="flex flex-col w-full h-full min-w-0">
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
             <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mb-8 shadow-sm border border-slate-100">
               <Zap size={32} className="text-blue-200" />
             </div>
             <h3 className="text-slate-800 font-bold mb-2">Live Inbox Active</h3>
             <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 max-w-[240px] leading-relaxed">
               Incoming messages will appear automatically at the top. Polling restricted to top 5 for speed.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxView;
