
import React, { useState, useEffect } from 'react';
import { 
  Facebook, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Settings2,
  ExternalLink,
  ChevronRight,
  UserPlus,
  Users,
  X,
  Info,
  ExternalLink as LinkIcon,
  ShieldAlert,
  Terminal,
  ArrowRight,
  Zap,
  Loader2,
  PlusCircle,
  Circle
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { loginWithFacebook, fetchUserPages, initFacebookSDK, isSecureOrigin, isAppIdConfigured } from '../../services/facebookService';
import { FacebookPage, User } from '../../types';

const PageSettings: React.FC = () => {
  const { pages, addPage, removePage, updatePage, agents, verifyPageConnection } = useApp();
  const [isConnecting, setIsConnecting] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigningPage, setAssigningPage] = useState<FacebookPage | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [verifyingPageId, setVerifyingPageId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{id: string, success: boolean} | null>(null);
  
  const isSecure = isSecureOrigin();
  const isConfigured = isAppIdConfigured();

  const isJSSDKError = error?.toLowerCase().includes('jssdk') || 
                       error?.toLowerCase().includes('javascript sdk') || 
                       error?.toLowerCase().includes('disabled');

  useEffect(() => {
    initFacebookSDK().then(() => setSdkReady(true));
  }, []);

  const handleConnectAccount = async () => {
    if (!sdkReady) return;
    setIsConnecting(true);
    setError(null);

    try {
      await loginWithFacebook();
      const userPages = await fetchUserPages();
      
      if (userPages.length === 0) {
        setError("Login successful, but no managed pages found. Ensure you are an Admin of the pages.");
      } else {
        setAvailablePages(userPages);
        setShowImportModal(true);
      }
    } catch (err: any) {
      console.error("FB Login Error Details:", err);
      setError(typeof err === 'string' ? err : err.message || 'Meta connection failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const togglePageSelection = async (page: FacebookPage) => {
    const isAlreadyAdded = pages.some(p => p.id === page.id);
    if (isAlreadyAdded) {
      await removePage(page.id);
    } else {
      await addPage(page);
    }
  };

  const handleVerify = async (pageId: string) => {
    setVerifyingPageId(pageId);
    setVerificationResult(null);
    const success = await verifyPageConnection(pageId);
    setVerificationResult({ id: pageId, success });
    setVerifyingPageId(null);
    setTimeout(() => setVerificationResult(null), 3000);
  };

  const toggleAgent = (pageId: string, agentId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    const currentIds = page.assignedAgentIds || [];
    const newIds = currentIds.includes(agentId) 
      ? currentIds.filter(id => id !== agentId)
      : [...currentIds, agentId];
    updatePage(pageId, { assignedAgentIds: newIds });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative">
         <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
            <Facebook size={12} /> App ID: 1148755260666274
         </div>
         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
           isSecure ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
         }`}>
            <ShieldAlert size={12} /> SSL: {isSecure ? 'Secure' : 'Unsecured (Fix Required)'}
         </div>
         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
           sdkReady ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
         }`}>
            <Terminal size={12} /> SDK: {sdkReady ? 'Ready' : 'Initializing...'}
         </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Pages & Messaging</h2>
          <p className="text-slate-500 text-lg max-w-xl">Link your Meta assets and verify real-time connectivity.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <button 
            onClick={handleConnectAccount}
            disabled={isConnecting || !sdkReady || !isConfigured || !isSecure}
            className={`flex items-center justify-center gap-3 px-10 py-5 rounded-3xl font-black uppercase tracking-[0.1em] transition-all shadow-xl group active:scale-95 ${
              isJSSDKError ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#1877F2] hover:bg-[#166fe5]'
            } text-white disabled:opacity-50`}
          >
            <PlusCircle size={20} className="group-hover:rotate-12 transition-transform" /> 
            {isConnecting ? 'Opening Meta...' : 'Add Another Page'}
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-8 md:p-12 rounded-[48px] border-4 shadow-2xl animate-in slide-in-from-top-4 duration-500 ${isJSSDKError ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex flex-col md:flex-row gap-8">
            <div className={`p-6 rounded-3xl h-fit flex-shrink-0 flex items-center justify-center ${isJSSDKError ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
              {isJSSDKError ? <ShieldAlert size={48} strokeWidth={2.5} /> : <AlertCircle size={48} strokeWidth={2.5} />}
            </div>
            <div className="space-y-6 flex-1 text-slate-700">
               <h3 className="text-3xl font-black uppercase tracking-tight">{isJSSDKError ? 'SDK Not Configured' : 'Connection Error'}</h3>
               <p className="text-lg">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {pages.length > 0 ? pages.map((page) => (
          <div key={page.id} className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl hover:border-blue-100 transition-all duration-500">
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1877F2]">
                  <Facebook size={32} />
                </div>
                <button 
                  onClick={() => setAssigningPage(page)}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                  <UserPlus size={16} /> Manage Access
                </button>
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{page.name}</h3>
              <p className="text-[12px] font-black text-blue-500/60 uppercase tracking-widest mt-1">{page.category}</p>
              
              <div className="mt-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Authorized Agents</p>
                <div className="flex flex-wrap gap-3">
                  {(page.assignedAgentIds || []).length > 0 ? (
                    page.assignedAgentIds.map(id => {
                      const agent = agents.find(a => a.id === id);
                      return agent ? (
                        <div key={id} className="flex items-center gap-2 pl-1 pr-4 py-1.5 bg-slate-50 text-slate-700 rounded-full text-[11px] font-bold border border-slate-100 group/item hover:bg-blue-50 hover:border-blue-200 transition-colors">
                           <img src={agent.avatar} className="w-7 h-7 rounded-full object-cover shadow-sm" />
                           {agent.name}
                        </div>
                      ) : null;
                    })
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100">
                      <Info size={14} /> Assign Agents to start handling chats
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-auto p-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-4">
               <button 
                onClick={() => handleVerify(page.id)}
                disabled={verifyingPageId === page.id}
                className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 border ${
                   verificationResult?.id === page.id 
                    ? (verificationResult.success ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-red-500 text-white border-red-600')
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-900 hover:text-white'
                }`}
               >
                  {verifyingPageId === page.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : verificationResult?.id === page.id ? (
                    verificationResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />
                  ) : (
                    <Zap size={16} />
                  )}
                  {verifyingPageId === page.id ? 'Checking...' : verificationResult?.id === page.id ? (verificationResult.success ? 'Connected' : 'Token Invalid') : 'Verify Live Connectivity'}
               </button>
               <button 
                onClick={() => removePage(page.id)} 
                className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                title="Disconnect Page"
               >
                  <Trash2 size={24} />
               </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
            <Facebook size={64} className="mb-6 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm opacity-40">No Facebook Pages linked to this portal.</p>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white rounded-[56px] shadow-2xl w-full max-w-lg p-12 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-3xl font-black text-slate-800 tracking-tight">Add Assets</h3>
                 <button onClick={() => setShowImportModal(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={32} /></button>
              </div>
              <p className="text-slate-500 mb-10 text-lg font-medium leading-relaxed">Select the Facebook Pages you want to manage within the portal.</p>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                 {availablePages.map(page => {
                   const isActive = pages.some(p => p.id === page.id);
                   return (
                     <button 
                        key={page.id}
                        onClick={() => togglePageSelection(page)}
                        className={`w-full flex items-center justify-between p-6 rounded-[32px] border-2 transition-all group ${
                          isActive 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200' 
                            : 'bg-slate-50 border-slate-100 hover:border-blue-400 text-slate-800'
                        }`}
                     >
                        <div className="flex items-center gap-4 text-left">
                           <div className={`p-3 rounded-2xl ${isActive ? 'bg-white/20' : 'bg-white'}`}>
                              <Facebook size={24} className={isActive ? 'text-white' : 'text-[#1877F2]'} />
                           </div>
                           <div>
                              <p className="font-black text-lg">{page.name}</p>
                              <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}`}>{page.category}</p>
                           </div>
                        </div>
                        {isActive ? <CheckCircle2 size={24} /> : <Circle size={24} className="opacity-20" />}
                     </button>
                   );
                 })}
              </div>

              <button 
                onClick={() => setShowImportModal(false)}
                className="w-full mt-10 py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl active:scale-95"
              >
                Sync Selected Pages
              </button>
           </div>
        </div>
      )}

      {/* Agent Assignment Modal */}
      {assigningPage && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[56px] shadow-[0_0_100px_rgba(0,0,0,0.2)] w-full max-w-md p-12 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-3xl font-black text-slate-800 tracking-tight">Agent Permissions</h3>
                 <button onClick={() => setAssigningPage(null)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={32} /></button>
              </div>
              <p className="text-slate-500 mb-10 text-lg">Who is authorized to chat for <span className="font-bold text-slate-900 underline decoration-blue-50">{assigningPage.name}</span>?</p>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {agents.map(agent => (
                  <button 
                    key={agent.id}
                    onClick={() => toggleAgent(assigningPage.id, agent.id)}
                    className={`w-full flex items-center justify-between p-6 rounded-[32px] border-2 transition-all group ${
                      (assigningPage.assignedAgentIds || []).includes(agent.id)
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200' 
                        : 'bg-white border-slate-100 hover:border-blue-400 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-5 text-left">
                       <img src={agent.avatar} className="w-14 h-14 rounded-2xl shadow-lg group-hover:scale-110 transition-transform" />
                       <div>
                          <p className="text-lg font-black leading-tight">{agent.name}</p>
                          <p className={`text-[10px] uppercase font-black tracking-[0.2em] mt-1 ${
                            (assigningPage.assignedAgentIds || []).includes(agent.id) ? 'text-blue-100' : 'text-slate-400'
                          }`}>{agent.role}</p>
                       </div>
                    </div>
                    {(assigningPage.assignedAgentIds || []).includes(agent.id) && (
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                        <CheckCircle2 size={20} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setAssigningPage(null)}
                className="w-full mt-10 py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
              >
                Save & Update Portal <ArrowRight size={20} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default PageSettings;
