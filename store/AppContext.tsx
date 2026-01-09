
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { User, UserRole, FacebookPage, Conversation, Message, ConversationStatus, ApprovedLink, ApprovedMedia } from '../types';
import { MASTER_ADMIN, MOCK_USERS } from '../constants';
import { apiService } from '../services/apiService';
import { fetchPageConversations, verifyPageAccessToken } from '../services/facebookService';

interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'success';
  message: string;
  details?: string;
}

interface CollectionStat {
  name: string;
  count: number;
  lastWrite?: string;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  pages: FacebookPage[];
  updatePage: (id: string, updates: Partial<FacebookPage>) => Promise<void>;
  addPage: (page: FacebookPage) => Promise<void>;
  removePage: (id: string) => Promise<void>;
  conversations: Conversation[];
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  messages: Message[];
  addMessage: (msg: Message) => Promise<void>;
  bulkAddMessages: (msgs: Message[], silent?: boolean) => Promise<void>;
  agents: User[];
  addAgent: (agent: User) => Promise<void>;
  removeAgent: (id: string) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  syncMetaConversations: (limit?: number) => Promise<void>;
  syncFullHistory: () => Promise<void>;
  verifyPageConnection: (pageId: string) => Promise<boolean>;
  approvedLinks: ApprovedLink[];
  addApprovedLink: (link: ApprovedLink) => Promise<void>;
  removeApprovedLink: (id: string) => Promise<void>;
  approvedMedia: ApprovedMedia[];
  addApprovedMedia: (media: ApprovedMedia) => Promise<void>;
  removeApprovedMedia: (id: string) => Promise<void>;
  dbStatus: 'connected' | 'syncing' | 'error' | 'initializing' | 'uninitialized';
  dbName: string;
  dbError: string | null;
  dbLogs: SystemLog[];
  dbCollections: CollectionStat[];
  lastSyncTime: string | null;
  isPolling: boolean;
  refreshMetadata: () => Promise<void>;
  dashboardStats: any;
  forceWriteTest: () => Promise<boolean>;
  clearLocalChats: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const USER_SESSION_KEY = 'messengerflow_supabase_session_v1';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error' | 'initializing' | 'uninitialized'>('initializing');
  const [dbName, setDbName] = useState("Supabase Cloud");
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbLogs, setDbLogs] = useState<SystemLog[]>([]);
  const [dbCollections, setDbCollections] = useState<CollectionStat[]>([]);
  
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<User[]>(MOCK_USERS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [approvedLinks, setApprovedLinks] = useState<ApprovedLink[]>([]);
  const [approvedMedia, setApprovedMedia] = useState<ApprovedMedia[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const pollIntervalRef = useRef<number | null>(null);
  const convsRef = useRef<Conversation[]>([]);

  useEffect(() => {
    convsRef.current = conversations;
  }, [conversations]);

  const addLog = (type: 'info' | 'error' | 'success', message: string, details?: string) => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };
    setDbLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const syncMetaConversations = async (limit: number = 5) => {
    if (pages.length === 0 || isPolling) return;
    setIsPolling(true);
    
    try {
      let hasChanges = false;
      const syncPromises = pages.map(async (page) => {
        if (!page.accessToken) return;
        try {
          const meta = await fetchPageConversations(page.id, page.accessToken, limit, true);
          
          const updates = meta.filter(mConv => {
            const existing = convsRef.current.find(c => c.id === mConv.id);
            if (!existing) return true;
            return new Date(mConv.lastTimestamp).getTime() > new Date(existing.lastTimestamp).getTime();
          });

          if (updates.length > 0) {
            hasChanges = true;
            await Promise.all(updates.map(c => apiService.put('conversations', c)));
          }
        } catch (e) {
          // If 401/403, we still keep the page but log it to avoid disconnecting active sessions
          console.warn(`Soft Sync failed for ${page.name}`, e);
        }
      });

      await Promise.all(syncPromises);
      
      if (hasChanges || limit > 5) {
        const all = await apiService.getAll<Conversation>('conversations');
        setConversations(all);
      }
      
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      addLog('error', 'Turbo Sync Engine Exception', err.message);
    } finally {
      setIsPolling(false);
    }
  };

  const syncFullHistory = async () => {
    addLog('info', 'Deep History Sync: Pulling 50+ users from Meta...');
    await syncMetaConversations(50);
    addLog('success', 'Deep History Loaded');
  };

  const loadDataFromCloud = async () => {
    setDbStatus('syncing');
    try {
      const [agentsData, pagesData, convsData, msgsData, linksData, mediaData] = await Promise.all([
        apiService.getAll<User>('agents'),
        apiService.getAll<FacebookPage>('pages'),
        apiService.getAll<Conversation>('conversations'),
        apiService.getAll<Message>('messages'),
        apiService.getAll<ApprovedLink>('links'),
        apiService.getAll<ApprovedMedia>('media')
      ]);

      setAgents(agentsData.length > 0 ? agentsData : MOCK_USERS);
      setPages(pagesData);
      setConversations(convsData);
      setMessages(msgsData);
      setApprovedLinks(linksData);
      setApprovedMedia(mediaData);
      
      setDbStatus('connected');
      addLog('success', 'Real-time Infrastructure Connected');

      const session = localStorage.getItem(USER_SESSION_KEY);
      if (session) setCurrentUser(JSON.parse(session));
    } catch (err: any) {
      setDbStatus('error');
      setDbError(err.message);
    }
  };

  // High-Frequency Turbo Poll (5 seconds for Inbox top 5)
  // For individual chats, a faster poll is triggered inside ChatWindow.tsx
  useEffect(() => {
    if (dbStatus === 'connected' && currentUser && pages.length > 0) {
      syncMetaConversations(5);

      pollIntervalRef.current = window.setInterval(() => {
        syncMetaConversations(5);
      }, 5000);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, [dbStatus, currentUser, pages.length]);

  useEffect(() => {
    loadDataFromCloud();
  }, []);

  const value: AppContextType = {
    currentUser, setCurrentUser,
    pages,
    addPage: async (p) => { await apiService.put('pages', p); setPages(prev => [...prev, p]); },
    removePage: async (id) => { await apiService.delete('pages', id); setPages(prev => prev.filter(p => p.id !== id)); },
    updatePage: async (id, u) => {
      const updated = pages.map(p => p.id === id ? { ...p, ...u } : p);
      setPages(updated);
      const page = updated.find(p => p.id === id);
      if (page) await apiService.put('pages', page);
    },
    conversations: [...conversations].sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()),
    updateConversation: async (id, u) => {
      const updated = conversations.map(c => c.id === id ? { ...c, ...u } : c);
      setConversations(updated);
      const conv = updated.find(c => c.id === id);
      if (conv) await apiService.put('conversations', conv);
    },
    deleteConversation: async (id) => {
      await apiService.delete('conversations', id);
      setConversations(prev => prev.filter(c => c.id !== id));
    },
    messages,
    addMessage: async (m) => { 
      setMessages(prev => {
        if (prev.find(existing => existing.id === m.id)) return prev;
        return [...prev, m];
      });
      await apiService.put('messages', m); 
    },
    bulkAddMessages: async (msgs) => {
      await Promise.all(msgs.map(m => apiService.put('messages', m)));
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNew = msgs.filter(m => !existingIds.has(m.id));
        return [...prev, ...uniqueNew];
      });
    },
    agents,
    addAgent: async (a) => { await apiService.put('agents', a); setAgents(prev => [...prev, a]); },
    removeAgent: async (id) => { await apiService.delete('agents', id); setAgents(p => p.filter(a => a.id !== id)); },
    updateUser: async (id, u) => {
      const updated = agents.map(a => a.id === id ? { ...a, ...u } : a);
      setAgents(updated);
      const agent = updated.find(a => a.id === id);
      if (agent) await apiService.put('agents', agent);
    },
    login: async (e, p) => {
      if (e === MASTER_ADMIN.email && p === MASTER_ADMIN.password) {
        setCurrentUser(MASTER_ADMIN);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(MASTER_ADMIN));
        return true;
      }
      const remoteUser = agents.find(u => u.email === e && u.password === p);
      if (remoteUser) {
        setCurrentUser(remoteUser);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(remoteUser));
        return true;
      }
      return false;
    },
    logout: async () => { localStorage.removeItem(USER_SESSION_KEY); setCurrentUser(null); },
    syncMetaConversations,
    syncFullHistory,
    verifyPageConnection: async (id) => {
      const page = pages.find(p => p.id === id);
      return page ? await verifyPageAccessToken(id, page.accessToken) : false;
    },
    approvedLinks,
    addApprovedLink: async (l) => { await apiService.put('links', l); setApprovedLinks(p => [...p, l]); },
    removeApprovedLink: async (id) => { await apiService.delete('links', id); setApprovedLinks(p => p.filter(l => l.id !== id)); },
    approvedMedia,
    addApprovedMedia: async (m) => { await apiService.put('media', m); setApprovedMedia(p => [...p, m]); },
    removeApprovedMedia: async (id) => { await apiService.delete('media', id); setApprovedMedia(p => p.filter(m => m.id !== id)); },
    dbStatus,
    dbName,
    dbError,
    dbLogs,
    dbCollections,
    lastSyncTime,
    isPolling,
    refreshMetadata: async () => {
      const collections = await apiService.getDbMetadata();
      setDbCollections(collections);
    },
    dashboardStats: {
      openChats: conversations.filter(c => c.status === ConversationStatus.OPEN).length,
      avgResponseTime: "0m 45s",
      resolvedToday: conversations.filter(c => c.status === ConversationStatus.RESOLVED).length,
      csat: "99%",
      chartData: [{ name: 'Mon', conversations: 14 }, { name: 'Tue', conversations: 28 }, { name: 'Wed', conversations: 31 }, { name: 'Thu', conversations: 19 }, { name: 'Fri', conversations: 44 }]
    },
    forceWriteTest: async () => {
      try {
        return await apiService.manualWriteToTest();
      } catch (e) {
        return false;
      }
    },
    clearLocalChats: async () => {
      localStorage.removeItem(USER_SESSION_KEY);
      window.location.reload();
    }
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
