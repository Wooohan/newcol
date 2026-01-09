
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut,
  ShieldCheck,
  Facebook,
  Key,
  X,
  Lock,
  Library,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { UserRole } from '../types';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  isCollapsed, 
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const { currentUser, logout, updateUser } = useApp();
  const [showSelfReset, setShowSelfReset] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newPass, setNewPass] = useState('');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.SUPER_ADMIN, UserRole.AGENT] },
    { id: 'inbox', label: 'Inbox', icon: MessageSquare, roles: [UserRole.SUPER_ADMIN, UserRole.AGENT] },
    { id: 'agents', label: 'Agents', icon: Users, roles: [UserRole.SUPER_ADMIN] },
    { id: 'pages', label: 'FB Pages', icon: Facebook, roles: [UserRole.SUPER_ADMIN] },
    { id: 'library', label: 'Media Library', icon: Library, roles: [UserRole.SUPER_ADMIN] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: [UserRole.SUPER_ADMIN, UserRole.AGENT] },
  ];

  const filteredItems = navItems.filter(item => 
    currentUser && item.roles.includes(currentUser.role)
  );

  const handleSelfReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && newPass) {
      updateUser(currentUser.id, { password: newPass });
      setIsSuccess(true);
      setNewPass('');
      
      // Close modal after 2 seconds of showing success
      setTimeout(() => {
        setShowSelfReset(false);
        setIsSuccess(false);
      }, 2000);
    }
  };

  const SidebarContent = (
    <div className={`h-full flex flex-col bg-white border-r border-slate-200 transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm z-50 transition-transform"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`p-6 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="min-w-[40px] w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
          <MessageSquare size={24} />
        </div>
        {!isCollapsed && <span className="font-bold text-xl text-slate-800 tracking-tight animate-in fade-in duration-300">Flow</span>}
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            title={isCollapsed ? item.label : ''}
            onClick={() => {
              setActiveView(item.id);
              if (window.innerWidth < 1024) setIsMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeView === item.id 
                ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm ring-1 ring-blue-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <item.icon size={20} className="min-w-[20px]" />
            {!isCollapsed && <span className="truncate animate-in fade-in duration-300">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className={`p-3 bg-slate-50 rounded-2xl mb-4 transition-all ${isCollapsed ? 'bg-transparent p-0' : ''}`}>
          <div className={`flex items-center gap-3 mb-3 ${isCollapsed ? 'justify-center mb-0' : ''}`}>
            <img src={currentUser?.avatar} alt="Avatar" className="w-10 h-10 min-w-[40px] rounded-full border-2 border-white shadow-sm" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                <p className="text-sm font-semibold text-slate-800 truncate">{currentUser?.name}</p>
                <div className="flex items-center gap-1">
                   <ShieldCheck size={12} className={currentUser?.role === UserRole.SUPER_ADMIN ? 'text-amber-500' : 'text-blue-500'} />
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                     {currentUser?.role === UserRole.SUPER_ADMIN ? 'Admin' : 'Agent'}
                   </p>
                </div>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <button 
              onClick={() => setShowSelfReset(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all animate-in fade-in"
            >
              <Key size={12} /> Security
            </button>
          )}
        </div>
        
        <button 
          onClick={logout}
          title={isCollapsed ? "Sign Out" : ""}
          className={`w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={20} className="min-w-[20px]" />
          {!isCollapsed && <span className="animate-in fade-in">Sign Out</span>}
        </button>
      </div>

      {showSelfReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {isSuccess ? (
              <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                  <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Password Updated</h3>
                <p className="text-sm text-slate-500 px-4">Your new credentials have been saved successfully. Portal syncing complete.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Security Credentials</h3>
                  <button onClick={() => setShowSelfReset(false)} className="p-2 hover:bg-slate-50 rounded-full"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSelfReset} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="password" 
                        required 
                        autoFocus
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Key size={18} /> Update Password
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block fixed left-0 top-0 h-screen z-50">
        {SidebarContent}
      </aside>

      <div className={`lg:hidden fixed inset-0 z-[100] transition-opacity duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
        <aside className={`absolute left-0 top-0 h-full transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {SidebarContent}
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
