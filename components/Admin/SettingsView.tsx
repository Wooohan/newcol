
import React, { useState } from 'react';
import { Settings, Shield, Globe, Bell, Smartphone, User, Database, CheckCircle2, Save, Trash2, AlertTriangle, X, Loader2, RefreshCw } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { UserRole } from '../../types';

const SettingsView: React.FC = () => {
  const { currentUser, updateUser, dbStatus, clearLocalChats, syncFullHistory } = useApp();
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const [portalName, setPortalName] = useState('MessengerFlow Portal');
  const [strictMode, setStrictMode] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePurge = async () => {
    setIsPurging(true);
    await clearLocalChats();
    setIsPurging(false);
    setShowPurgeConfirm(false);
  };

  const handleSyncAll = async () => {
    if (isSyncingAll) return;
    setIsSyncingAll(true);
    try {
      await syncFullHistory();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: any) {
      console.error("Full Sync Error:", err);
      // More descriptive error based on likely causes
      const msg = err.message || "Unknown Meta API Error";
      alert(`Sync failed for some pages: ${msg}\n\nEnsure your Page Access Tokens are valid and you have requested 'pages_messaging' permissions.`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 md:px-0 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Portal Settings</h2>
          <p className="text-slate-500 text-sm mt-1">Configure system-wide preferences and security policies.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
        >
          {isSaving ? <CheckCircle2 className="animate-pulse" size={20} /> : <Save size={20} />}
          {isSaving ? 'Saving Changes...' : 'Save Configuration'}
        </button>
      </div>

      {showSuccess && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm flex items-center gap-3 animate-in slide-in-from-top-4">
           <CheckCircle2 size={20} /> Operation successful. Records synchronized.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
                 <User size={24} />
              </div>
              <h4 className="font-bold text-slate-800">Your Account</h4>
              <p className="text-xs text-slate-400">Logged in as {currentUser?.name}</p>
              <div className="pt-4">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {currentUser?.role}
                 </span>
              </div>
           </div>

           <div className="bg-slate-900 p-6 rounded-[32px] text-white space-y-4 shadow-xl shadow-slate-200">
              <div className="flex items-center gap-3">
                 <Database size={20} className="text-blue-400" />
                 <h4 className="font-bold text-sm uppercase tracking-widest">System Health</h4>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                    <span>Database Status</span>
                    <span className="text-emerald-400">{dbStatus}</span>
                 </div>
                 <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[100%]" />
                 </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed italic">All records are stored locally in Encrypted IndexedDB partitions.</p>
           </div>
        </div>

        <div className="md:col-span-2 space-y-6">
           <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                   <Globe size={20} className="text-slate-400" />
                   <h3 className="font-bold text-slate-800">General Branding</h3>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Portal Interface Name</label>
                  <input 
                    type="text" 
                    value={portalName}
                    style={{ fontSize: '16px' }}
                    onChange={(e) => setPortalName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-slate-700"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <RefreshCw size={20} className="text-blue-500" />
                    <h3 className="font-bold text-slate-800">Advanced Sync Tools</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-blue-800">Sync All History</h4>
                        <p className="text-[10px] text-blue-600 mt-1 uppercase font-black">Fetches 100+ chats from Meta</p>
                      </div>
                      <button 
                        onClick={handleSyncAll}
                        disabled={isSyncingAll}
                        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
                      >
                        {isSyncingAll ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                        {isSyncingAll ? 'Processing...' : 'Start Full Sync'}
                      </button>
                    </div>

                    <div className="p-6 bg-red-50 rounded-3xl border border-red-100 space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-red-800">Purge Local Message Database</h4>
                        <p className="text-xs text-red-600 mt-1 leading-relaxed">This will delete all conversation and message logs from this portal. Action is local only.</p>
                      </div>
                      <button 
                        onClick={() => setShowPurgeConfirm(true)}
                        className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} /> Clear All Chats
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                   <Shield size={20} className="text-slate-400" />
                   <h3 className="font-bold text-slate-800">Security & Compliance</h3>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <div>
                      <h4 className="text-sm font-bold text-slate-800">Strict Link Enforcement</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tight font-bold mt-0.5">Blocks non-library URLs in all chats</p>
                   </div>
                   <button 
                    onClick={() => setStrictMode(!strictMode)}
                    className={`w-14 h-7 rounded-full transition-all flex items-center px-1 ${strictMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                   >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all ${strictMode ? 'translate-x-7' : 'translate-x-0'}`} />
                   </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                   <Bell size={20} className="text-slate-400" />
                   <h3 className="font-bold text-slate-800">Notifications</h3>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <div>
                      <h4 className="text-sm font-bold text-slate-800">Desktop Push Notifications</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tight font-bold mt-0.5">Notify agents on incoming Meta messages</p>
                   </div>
                   <button 
                    onClick={() => setNotifEnabled(!notifEnabled)}
                    className={`w-14 h-7 rounded-full transition-all flex items-center px-1 ${notifEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                   >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all ${notifEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                   </button>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Purge Confirmation Modal */}
      {showPurgeConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm p-10 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-4">Are you sure?</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              This will permanently delete <span className="font-bold text-slate-900">all local chat history</span> from this portal. You will need to re-sync with Meta to see messages again.
            </p>
            <div className="space-y-3">
              <button 
                onClick={handlePurge}
                disabled={isPurging}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100 active:scale-95"
              >
                {isPurging ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                {isPurging ? 'Purging...' : 'Yes, Delete Everything'}
              </button>
              <button 
                onClick={() => setShowPurgeConfirm(false)}
                className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
