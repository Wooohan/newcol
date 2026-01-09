
import React, { useState } from 'react';
import { UserPlus, Shield, Mail, Activity, Trash2, Key, X, LayoutGrid, CheckCircle2, ChevronRight, Facebook, AlertTriangle, Save } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { UserRole, User, FacebookPage } from '../../types';

const AgentManagement: React.FC = () => {
  const { agents, pages, addAgent, updateUser, removeAgent, currentUser } = useApp();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [assigningAgent, setAssigningAgent] = useState<User | null>(null);
  const [showResetModal, setShowResetModal] = useState<User | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.AGENT);

  const [resetPassValue, setResetPassValue] = useState('');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    const newAgent: User = {
      id: `agent-${Date.now()}`,
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
      avatar: `https://picsum.photos/seed/${Math.random()}/200`,
      status: 'offline',
      assignedPageIds: [],
    };

    addAgent(newAgent);
    setNewName(''); setNewEmail(''); setNewPassword('');
    setShowInviteModal(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetModal || !resetPassValue) return;
    
    await updateUser(showResetModal.id, { password: resetPassValue });
    setResetPassValue('');
    setShowResetModal(null);
  };

  const handleDeleteAgent = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
      await removeAgent(id);
    }
  };

  const togglePageAssignment = (pageId: string) => {
    if (!assigningAgent) return;
    const currentPages = assigningAgent.assignedPageIds || [];
    const newPages = currentPages.includes(pageId)
      ? currentPages.filter(id => id !== pageId)
      : [...currentPages, pageId];
    
    updateUser(assigningAgent.id, { assignedPageIds: newPages });
    setAssigningAgent({ ...assigningAgent, assignedPageIds: newPages });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Agent Control Center</h2>
          <p className="text-slate-500 text-sm mt-1">Assign agents to specific Facebook Pages and manage credentials.</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl"
        >
          <UserPlus size={20} /> Add New Agent
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Access</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <img src={agent.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{agent.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{agent.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <button 
                        onClick={() => setAssigningAgent(agent)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100 transition-all"
                     >
                       <Facebook size={14} />
                       {agent.assignedPageIds?.length || 0} Pages Assigned
                     </button>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      agent.status === 'online' ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-50'
                    }`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setShowResetModal(agent)}
                          className="p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                          title="Reset Password"
                        >
                           <Key size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAgent(agent.id)}
                          disabled={agent.id === currentUser?.id}
                          className={`p-2.5 rounded-xl transition-all ${agent.id === currentUser?.id ? 'opacity-20 cursor-not-allowed' : 'hover:bg-red-50 hover:text-red-500 text-slate-400'}`}
                          title="Delete Agent"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm p-10 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-bold text-slate-800">Reset Credentials</h3>
                 <button onClick={() => setShowResetModal(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={24} /></button>
              </div>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Assign a new secure password for <span className="font-bold text-slate-800">{showResetModal.name}</span>.</p>
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <input 
                    type="password" 
                    required 
                    autoFocus
                    value={resetPassValue}
                    onChange={e => setResetPassValue(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-amber-600 text-white rounded-2xl font-bold shadow-xl hover:bg-amber-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} /> Commit Reset
                </button>
              </form>
           </div>
        </div>
      )}

      {/* Page Assignment Modal */}
      {assigningAgent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-2xl font-bold text-slate-800">Page Assignment</h3>
                   <p className="text-sm text-slate-500">Enable page access for <span className="font-bold">{assigningAgent.name}</span></p>
                 </div>
                 <button onClick={() => setAssigningAgent(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={24} /></button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {pages.length > 0 ? (
                  pages.map(page => (
                    <button 
                      key={page.id}
                      onClick={() => togglePageAssignment(page.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        (assigningAgent.assignedPageIds || []).includes(page.id)
                          ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-50' 
                          : 'bg-white border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <Facebook size={20} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-800">{page.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-black">{page.category}</p>
                          </div>
                      </div>
                      {(assigningAgent.assignedPageIds || []).includes(page.id) && <CheckCircle2 className="text-blue-600" size={20} />}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 italic text-sm">No pages connected.</div>
                )}
              </div>

              <button 
                onClick={() => setAssigningAgent(null)}
                className="w-full mt-8 py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-xl hover:bg-blue-700 transition-all"
              >
                Save Permissions
              </button>
           </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-10 animate-in zoom-in-95">
              <h3 className="text-2xl font-bold text-slate-800 mb-8">Register New Agent</h3>
              <form onSubmit={handleInvite} className="space-y-6">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Agent Name</label>
                   <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Agent Email</label>
                   <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Initial Password</label>
                   <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500" />
                 </div>
                 <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-xl hover:bg-blue-700 transition-all">Complete Registration</button>
                 <button type="button" onClick={() => setShowInviteModal(false)} className="w-full text-slate-400 font-bold text-xs py-2">Cancel</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagement;
