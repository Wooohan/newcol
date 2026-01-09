import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import Sidebar from './components/Sidebar';
import DashboardView from './components/Dashboard/DashboardView';
import InboxView from './components/Inbox/InboxView';
import AgentManagement from './components/Admin/AgentManagement';
import PageSettings from './components/Admin/PageSettings';
import MediaLibrary from './components/Admin/MediaLibrary';
import SettingsView from './components/Admin/SettingsView';
import { initFacebookSDK } from './services/facebookService';
import { Mail, Lock, Loader2, AlertCircle, MessageSquare, Bell, Menu, CloudOff, Cloud, Database, Copy, Check, Terminal } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, dbStatus, dbError } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sqlSchema = `CREATE TABLE IF NOT EXISTS agents (id TEXT PRIMARY KEY, name TEXT, email TEXT, password TEXT, role TEXT, avatar TEXT, status TEXT, "assignedPageIds" JSONB);
CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY, name TEXT, category TEXT, "isConnected" BOOLEAN, "accessToken" TEXT, "assignedAgentIds" JSONB);
CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, "pageId" TEXT, "customerId" TEXT, "customerName" TEXT, "customerAvatar" TEXT, "lastMessage" TEXT, "lastTimestamp" TEXT, status TEXT, "assignedAgentId" TEXT, "unreadCount" INTEGER);
CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, "conversationId" TEXT, "senderId" TEXT, "senderName" TEXT, text TEXT, timestamp TEXT, "isIncoming" BOOLEAN, "isRead" BOOLEAN);
CREATE TABLE IF NOT EXISTS links (id TEXT PRIMARY KEY, title TEXT, url TEXT, category TEXT);
CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, title TEXT, url TEXT, type TEXT, "isLocal" BOOLEAN);
CREATE TABLE IF NOT EXISTS provisioning_logs (id TEXT PRIMARY KEY, status TEXT, timestamp TEXT);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password. Use your authorized credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-indigo-50">
      
      {dbStatus === 'uninitialized' && (
        <div className="w-full max-w-2xl mb-8 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-slate-900 rounded-[40px] p-8 md:p-10 text-white shadow-2xl border border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
              <Database size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-amber-500 text-slate-900 rounded-lg">
                   <AlertCircle size={20} />
                 </div>
                 <h2 className="text-xl font-black uppercase tracking-widest">Database Setup Required</h2>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Supabase connection is active, but your tables are missing. Paste this SQL into your <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-400 underline">Supabase SQL Editor</a> to initialize:
              </p>
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 font-mono text-[10px] text-blue-200 border border-white/5 relative group/code">
                 <pre className="whitespace-pre-wrap break-all h-24 overflow-y-auto custom-scrollbar">{sqlSchema}</pre>
                 <button 
                  onClick={copySql}
                  className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                 >
                   {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                 </button>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-all"
              >
                <Cloud size={14} /> I've run the script, reload portal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 md:p-12 rounded-[40px] md:rounded-[48px] shadow-2xl shadow-blue-200/50 max-w-md w-full border border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-blue-200 ring-4 ring-blue-50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2 animate-in fade-in slide-in-from-top-2">Portal Access</h1>
          <p className="text-slate-500 mb-8 md:mb-10 font-medium">Log in to your agent workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="agent@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {(error || (dbStatus === 'error' && dbError)) && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in shake duration-300">
                <AlertCircle size={16} />
                {error || dbError}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading || dbStatus === 'uninitialized' || dbStatus === 'syncing'}
              className="w-full py-4 md:py-5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 transform active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In to Portal'}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              {dbStatus === 'error' ? (
                <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                  <CloudOff size={10} /> Local Access Mode
                </div>
              ) : dbStatus === 'connected' ? (
                <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                  <Cloud size={10} /> Supabase Sync Active
                </div>
              ) : dbStatus === 'uninitialized' ? (
                <div className="flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase tracking-widest px-3 py-1 bg-rose-50 rounded-full border border-rose-100">
                  <Terminal size={10} /> Schema Missing
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1">
                  <Loader2 size={10} className="animate-spin" /> Verifying Cloud...
                </div>
              )}
            </div>
            
            <a 
              href="/messengerflow-realtime.tar.gz" 
              download
              className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition-all"
            >
              <Download size={12} /> Download Complete Project
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const PortalContent: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { currentUser } = useApp();

  useEffect(() => {
    initFacebookSDK().then(() => setIsSdkReady(true));
  }, []);

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'inbox': return <InboxView />;
      case 'agents': return <AgentManagement />;
      case 'pages': return <PageSettings />;
      case 'library': return <MediaLibrary />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-40">
           <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl">
             <Menu size={24} />
           </button>
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
               <MessageSquare size={18} />
             </div>
             <span className="font-bold text-lg text-slate-800">Flow</span>
           </div>
           <button className="p-2 text-slate-400">
             <Bell size={20} />
           </button>
        </header>

        <div className="p-4 md:p-8 flex-1">
          {!isSdkReady && (
            <div className="mb-6 p-3 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl text-center border border-amber-100">
              Initializing Facebook Engine...
            </div>
          )}
          <div className="max-w-[1600px] mx-auto">
            {renderView()}
          </div>
        </div>
        
        <footer className="px-8 py-6 text-[10px] text-slate-400 font-medium uppercase tracking-widest text-center border-t border-slate-100 bg-white/50">
          MessengerFlow SaaS v2.0.0 • Real-Time Edition Active
        </footer>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <PortalContent />
    </AppProvider>
  );
};

export default App;
