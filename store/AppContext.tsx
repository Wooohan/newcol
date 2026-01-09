import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { User, UserRole, FacebookPage, Conversation, Message, ConversationStatus, ApprovedLink, ApprovedMedia } from '../types';
import { apiService } from '../services/apiService';
import { fetchPageConversations, fetchThreadMessages, verifyPageAccessToken } from '../services/facebookService';

interface DashboardStats {
  openChats: number;
  avgResponseTime: string;
  resolvedToday: number;
  csat: string;
  chartData: { name: string; conversations: number }[];
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
  syncMetaConversations: () => Promise<void>;
  syncFullHistory: () => Promise<void>;
  verifyPageConnection: (pageId: string) => Promise<boolean>;
  simulateIncomingWebhook: (pageId: string) => Promise<void>;
  approvedLinks: ApprovedLink[];
  addApprovedLink: (link: ApprovedLink) => Promise<void>;
  removeApprovedLink: (id: string) => Promise<void>;
  approvedMedia: ApprovedMedia[];
  addApprovedMedia: (media: ApprovedMedia) => Promise<void>;
  removeApprovedMedia: (id: string) => Promise<void>;
  dashboardStats: DashboardStats;
  dbStatus: 'connected' | 'syncing' | 'error' | 'initializing';
  clearLocalChats: () => Promise<void>;
  isHistorySynced: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const SYNCED_KEY = 'messengerflow_is_synced';

const fetchAsBlob = async (url: string): Promise<Blob | null> => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.blob();
  } catch (e) {
    console.warn("Could not fetch avatar as binary:", url, e);
    return null;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error' | 'initializing'>('initializing');
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [approvedLinks, setApprovedLinks] = useState<ApprovedLink[]>([]);
  const [approvedMedia, setApprovedMedia] = useState<ApprovedMedia[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHistorySynced, setIsHistorySynced] = useState(localStorage.getItem(SYNCED_KEY) === 'true');
  
  const [portalActivationTime] = useState<number>(Date.now());

  // Initialize data from server
  useEffect(() => {
    const initData = async () => {
      try {
        setDbStatus('initializing');
        
        // Try to get current user from session
        try {
          const user = await apiService.getCurrentUser();
          setCurrentUser(user);
        } catch (err) {
          // Not logged in, that's okay
          console.log('No active session');
        }

        // Load initial data (only if logged in)
        if (currentUser) {
          const [agentsData, pagesData, convsData, linksData, mediaData] = await Promise.all([
            apiService.getAllAgents(),
            apiService.getAllPages(),
            apiService.getAllConversations(),
            apiService.getAllLinks(),
            apiService.getAllMedia(),
          ]);

          setAgents(agentsData);
          setPages(pagesData);
          setConversations(convsData);
          setApprovedLinks(linksData);
          setApprovedMedia(mediaData);
        }

        setDbStatus('connected');
      } catch (err) {
        console.error('Initialization error:', err);
        setDbStatus('error');
      }
    };
    initData();
  }, [currentUser?.id]);

  // Background sync for conversations
  useEffect(() => {
    if (pages.length === 0 || !currentUser) return;
    
    const deltaSync = async () => {
      const existingMap = new Map(conversations.map(c => [c.id, c]));
      let changesDetected = false;

      for (const page of pages) {
        if (!page.accessToken) continue;
        try {
          const metaConvs = await fetchPageConversations(page.id, page.accessToken, 5, true);
          for (const conv of metaConvs) {
            const local = existingMap.get(conv.id);
            const convTime = new Date(conv.lastTimestamp).getTime();

            if (!isHistorySynced && convTime < portalActivationTime) {
              continue; 
            }

            if (!local || local.lastTimestamp !== conv.lastTimestamp) {
              if (local && local.customerAvatarBlob) {
                conv.customerAvatarBlob = local.customerAvatarBlob;
              }
              await apiService.createConversation(conv);
              changesDetected = true;
            }
          }
        } catch (e) {
          console.warn("Delta background poll failed for page", page.name);
        }
      }

      if (changesDetected) {
        const all = await apiService.getAllConversations();
        setConversations(all);
      }
    };

    const interval = setInterval(deltaSync, 10000); 
    return () => clearInterval(interval);
  }, [pages, conversations.length, isHistorySynced, portalActivationTime, currentUser]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => 
      new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
  }, [conversations]);

  const dashboardStats = useMemo(() => {
    const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
    const relevantConvs = sortedConversations.filter(c => {
      const page = pages.find(p => p.id === c.pageId);
      return isAdmin || (page?.assignedAgentIds || []).includes(currentUser?.id || '');
    });
    
    const openChats = relevantConvs.filter(c => c.status === ConversationStatus.OPEN).length;
    const resolvedToday = relevantConvs.filter(c => c.status === ConversationStatus.RESOLVED).length;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const chartData = last7Days.map(dateStr => {
      const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
      const count = relevantConvs.filter(c => c.lastTimestamp.startsWith(dateStr)).length;
      return { name: dayName, conversations: count };
    });

    return { 
      openChats, 
      avgResponseTime: "0m 30s", 
      resolvedToday, 
      csat: "98%",
      chartData
    };
  }, [sortedConversations, currentUser, pages]);

  const syncMetaConversations = async () => {
    if (pages.length === 0) return;
    setDbStatus('syncing');
    try {
      const existingConvs = await apiService.getAllConversations();
      const existingMap = new Map(existingConvs.map(c => [c.id, c]));

      for (const page of pages) {
        if (!page.accessToken) continue;
        const metaConvs = await fetchPageConversations(page.id, page.accessToken, 5, true);
        
        for (const conv of metaConvs) {
          const local = existingMap.get(conv.id);
          if (local && local.customerAvatarBlob) {
            conv.customerAvatarBlob = local.customerAvatarBlob;
          } else if (conv.customerAvatar) {
            const blob = await fetchAsBlob(conv.customerAvatar);
            if (blob) conv.customerAvatarBlob = blob;
          }
          await apiService.createConversation(conv);
        }
      }
      const allConvs = await apiService.getAllConversations();
      setConversations(allConvs);
    } catch (e) {
      console.error("Inbox Sync failed", e);
    } finally {
      setDbStatus('connected');
    }
  };

  const syncFullHistory = async () => {
    if (pages.length === 0) return;
    setDbStatus('syncing');
    let hasOneSuccess = false;
    let lastErr = null;

    try {
      const existingConvs = await apiService.getAllConversations();
      const existingMap = new Map(existingConvs.map(c => [c.id, c]));

      for (const page of pages) {
        if (!page.accessToken) continue;
        try {
          const metaConvs = await fetchPageConversations(page.id, page.accessToken, 100, true);
          for (const conv of metaConvs) {
            const local = existingMap.get(conv.id);
            if (local && local.customerAvatarBlob) {
              conv.customerAvatarBlob = local.customerAvatarBlob;
            } else if (conv.customerAvatar) {
              const blob = await fetchAsBlob(conv.customerAvatar);
              if (blob) conv.customerAvatarBlob = blob;
            }
            await apiService.createConversation(conv);
          }
          hasOneSuccess = true;
        } catch (pageErr) {
          console.warn(`Sync failed for page ${page.name}`, pageErr);
          lastErr = pageErr;
        }
      }
      
      if (!hasOneSuccess && lastErr) throw lastErr;

      const allConvs = await apiService.getAllConversations();
      setConversations(allConvs);
      setIsHistorySynced(true);
      localStorage.setItem(SYNCED_KEY, 'true');
    } catch (e) {
      console.error("Full history sync failed", e);
      throw e;
    } finally {
      setDbStatus('connected');
    }
  };

  const clearLocalChats = async () => {
    setDbStatus('syncing');
    try {
      await apiService.clearAllConversations();
      setConversations([]);
      setMessages([]);
      setIsHistorySynced(false);
      localStorage.setItem(SYNCED_KEY, 'false');
      window.location.reload(); 
    } catch (e) {
      console.error("Clear failed", e);
    } finally {
      setDbStatus('connected');
    }
  };

  const deleteConversation = async (id: string) => {
    setDbStatus('syncing');
    try {
      await apiService.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      setMessages(prev => prev.filter(m => m.conversationId !== id));
    } catch (e) {
      console.error("Delete conversation failed", e);
    } finally {
      setDbStatus('connected');
    }
  };

  const verifyPageConnection = async (pageId: string): Promise<boolean> => {
    const page = pages.find(p => p.id === pageId);
    if (!page?.accessToken) return false;
    return await verifyPageAccessToken(pageId, page.accessToken);
  };

  const addApprovedLink = async (link: ApprovedLink) => {
    await apiService.createLink(link);
    setApprovedLinks(prev => [...prev, link]);
  };

  const removeApprovedLink = async (id: string) => {
    await apiService.deleteLink(id);
    setApprovedLinks(prev => prev.filter(l => l.id !== id));
  };

  const addApprovedMedia = async (media: ApprovedMedia) => {
    await apiService.createMedia(media);
    setApprovedMedia(prev => [...prev, media]);
  };

  const removeApprovedMedia = async (id: string) => {
    await apiService.deleteMedia(id);
    setApprovedMedia(prev => prev.filter(m => m.id !== id));
  };

  const updatePage = async (id: string, updates: Partial<FacebookPage>) => {
    setDbStatus('syncing');
    const updated = pages.map(p => p.id === id ? { ...p, ...updates } : p);
    setPages(updated);
    const page = updated.find(p => p.id === id);
    if (page) await apiService.updatePage(id, updates);
    setDbStatus('connected');
  };

  const addPage = async (page: FacebookPage) => {
    setDbStatus('syncing');
    setPages(prev => {
      if (prev.find(p => p.id === page.id)) return prev;
      return [...prev, page];
    });
    await apiService.createPage(page);
    setDbStatus('connected');
  };

  const removePage = async (id: string) => {
    setDbStatus('syncing');
    setPages(prev => prev.filter(p => p.id !== id));
    await apiService.deletePage(id);
    setDbStatus('connected');
  };

  const removeAgent = async (id: string) => {
    setDbStatus('syncing');
    setAgents(prev => prev.filter(a => a.id !== id));
    await apiService.deleteAgent(id);
    setDbStatus('connected');
  };

  const updateConversation = async (id: string, updates: Partial<Conversation>) => {
    const updated = conversations.map(c => c.id === id ? { ...c, ...updates } : c);
    setConversations(updated);
    await apiService.updateConversation(id, updates);
  };

  const bulkAddMessages = async (msgs: Message[], silent: boolean = false) => {
    const existingIds = new Set(messages.map(m => m.id));
    const newOnes = msgs.filter(m => !existingIds.has(m.id));
    
    if (newOnes.length === 0) return;
    
    await apiService.createBulkMessages(newOnes);
    
    const last = newOnes[newOnes.length - 1];
    await updateConversation(last.conversationId, {
      lastMessage: last.text,
      lastTimestamp: last.timestamp,
    });

    setMessages(prev => [...prev, ...newOnes]);
  };

  const addMessage = async (msg: Message) => {
    await bulkAddMessages([msg]);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password);
      if (response.success && response.user) {
        setCurrentUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setCurrentUser(null);
    window.location.reload();
  };

  const simulateIncomingWebhook = async (pageId: string) => {
    const customerId = `sim-${Date.now()}`;
    const newConv: Conversation = {
      id: `conv-sim-${Date.now()}`,
      pageId,
      customerId,
      customerName: "Simulated User",
      customerAvatar: `https://picsum.photos/seed/${customerId}/200`,
      lastMessage: "Test message",
      lastTimestamp: new Date().toISOString(),
      status: ConversationStatus.OPEN,
      assignedAgentId: null,
      unreadCount: 1,
    };
    setConversations(prev => [newConv, ...prev]);
    await apiService.createConversation(newConv);
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      pages, addPage, removePage, updatePage,
      conversations: sortedConversations, updateConversation, deleteConversation,
      messages, addMessage, bulkAddMessages,
      agents, 
      addAgent: async (a) => { 
        setAgents(p => [...p, a]); 
        await apiService.createAgent(a); 
      },
      removeAgent,
      updateUser: async (id, u) => { 
        const updated = agents.map(a => a.id === id ? { ...a, ...u } : a);
        setAgents(updated);
        await apiService.updateAgent(id, u);
        if (currentUser?.id === id) {
          const updatedUser = { ...currentUser, ...u };
          setCurrentUser(updatedUser);
        }
      },
      login, logout, syncMetaConversations, syncFullHistory, verifyPageConnection,
      simulateIncomingWebhook,
      approvedLinks, addApprovedLink, removeApprovedLink,
      approvedMedia, addApprovedMedia, removeApprovedMedia,
      dashboardStats, dbStatus, clearLocalChats,
      isHistorySynced
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
