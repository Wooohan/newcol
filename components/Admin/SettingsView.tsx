
import React, { useState, useEffect, useRef } from 'react';
import { Shield, User, Database, CheckCircle2, RefreshCw, AlertTriangle, Loader2, Server, Terminal, FileText, Trash2, Zap, Copy, Check } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { UserRole } from '../../types';

const SettingsView: React.FC = () => {
  const { currentUser, dbStatus, dbLogs, dbCollections, forceWriteTest, clearLocalChats, syncFullHistory, refreshMetadata } = useApp();
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dbLogs]);

  const handleForceWrite = async () => {
    setIsProvisioning(true);
    setProvisionSuccess(null);
    const success = await forceWriteTest();
    setProvisionSuccess(success);
    setIsProvisioning(false);
    
    if (success) {
      setTimeout(() => setProvisionSuccess(null), 8000);
    }
  };

  const sqlSchema = `-- RUN THIS IN SUPABASE SQL EDITOR
CREATE TABLE IF NOT EXISTS agents (id TEXT PRIMARY KEY, name TEXT, email TEXT, password TEXT, role TEXT, avatar TEXT, status TEXT, "assignedPageIds" JSONB);
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 md:px-0 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Infrastructure</h2>
          <p className="text-slate-500 text-sm mt-1">Provider: Supabase PostgreSQL • Protocol: REST/HTTP</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
           {/* Engine Status */}
           <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3">
                 <Database size={20} className="text-emerald-400" />
                 <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Database Engine</h4>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className="text-slate-500">Connection Status</span>
                    <span className={dbStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}>
                      {dbStatus.toUpperCase()}
                    </span>
                 </div>
                 <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${dbStatus === 'connected' ? 'bg-emerald-500 w-full' : 'bg-amber-500 w-1/2 animate-pulse'}`} />
                 </div>
              </div>
           </div>

           {/* Table Health Inspector */}
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Table Health Check</h4>
                <button onClick={refreshMetadata} className="text-blue-500 hover:rotate-180 transition-transform duration-500">
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {dbCollections.map(col => (
                  <div key={col.name} className={`p-3 rounded-xl border flex items-center justify-between ${ (col as any).exists ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center gap-2">
                      <FileText size={12} className={(col as any).exists ? 'text-emerald-600' : 'text-rose-600'} />
                      <span className="text-[11px] font-bold text-slate-700">{col.name}</span>
                    </div>
                    {(col as any).exists ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <AlertTriangle size={12} className="text-rose-500 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           {/* SQL Setup Helper */}
           <div className="bg-blue-600 p-8 md:p-10 rounded-[48px] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                <Shield size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-4">PostgreSQL Schema Setup</h3>
                <p className="text-blue-100 text-sm mb-8 leading-relaxed">
                  Supabase requires tables to be created before use. Copy the SQL below and run it in your **Supabase SQL Editor** to initialize the project.
                </p>
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 font-mono text-[10px] text-blue-200 border border-white/10 relative group/code">
                   <pre className="whitespace-pre-wrap break-all">{sqlSchema.substring(0, 150)}...</pre>
                   <button 
                    onClick={copySql}
                    className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                   >
                     {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                   </button>
                </div>
              </div>
           </div>

           {/* Debug Terminal */}
           <div className="bg-[#0c0c0e] rounded-[32px] border-2 border-slate-800 p-8 shadow-2xl">
              <div className="flex items-center gap-3 text-emerald-500 mb-6">
                <Terminal size={20} />
                <h3 className="font-black text-xs uppercase tracking-[0.2em]">Live Handshake Stream</h3>
              </div>
              <div className="h-48 overflow-y-auto bg-black/40 rounded-2xl p-6 font-mono text-[10px] text-emerald-400/80 border border-white/5 space-y-1 custom-scrollbar">
                {dbLogs.map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                    <span className={`shrink-0 font-bold ${log.type === 'error' ? 'text-rose-500' : log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}`}>
                      {log.type.toUpperCase()}:
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
           </div>

           {/* Maintenance */}
           <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h4 className="font-black text-slate-800">Connection Verification</h4>
                <p className="text-xs text-slate-400">Trigger a manual write to check Supabase permissions.</p>
              </div>
              <button 
                onClick={handleForceWrite}
                disabled={isProvisioning}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isProvisioning ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                {provisionSuccess === true ? 'Verified' : 'Test Handshake'}
              </button>
              <button 
                onClick={() => setShowPurgeConfirm(true)}
                className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all"
              >
                Clear Local Cache
              </button>
           </div>
        </div>
      </div>

      {showPurgeConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm p-10 text-center">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4">Reset Portal?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">This clears your local session and local storage. Supabase Cloud remains untouched.</p>
            <button onClick={clearLocalChats} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-rose-100 mb-3">Confirm Reset</button>
            <button onClick={() => setShowPurgeConfirm(false)} className="w-full py-4 text-slate-400 font-bold uppercase text-xs">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
