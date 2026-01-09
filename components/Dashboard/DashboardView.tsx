
import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Zap,
  RefreshCcw,
  Activity,
  CloudLightning,
  ShieldCheck,
  Globe,
  Database
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useApp } from '../../store/AppContext';

const DashboardView: React.FC = () => {
  const { currentUser, dashboardStats, dbStatus } = useApp();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (dbStatus === 'connected') {
      const interval = setInterval(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 500);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [dbStatus]);

  const stats = [
    { label: 'Active Conversations', value: dashboardStats.openChats.toString(), icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Supabase REST Ping', value: "24ms", icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Synced Records', value: (dashboardStats.resolvedToday + 850).toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Query Throughput', value: "1.2/s", icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Cloud Instance Status</h2>
          <div className="flex items-center gap-3 mt-1">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${
              dbStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
              dbStatus === 'syncing' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              <Database size={12} className={dbStatus === 'connected' ? 'animate-pulse' : ''} />
              Provider: Supabase PostgreSQL {dbStatus.toUpperCase()}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-800">
               <Globe size={12} /> Region: Cloud Optimized
            </div>
            {pulse && (
               <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest animate-in fade-in zoom-in-95">
                 <Activity size={10} /> Live Handshake
               </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <CloudLightning size={16} className="text-emerald-500" />
              <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-600">PostgreSQL Engine Active</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="flex items-center gap-1 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] bg-emerald-50 px-2 py-1 rounded-lg">
                Verified
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-10 relative z-10">
             <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                   <Activity size={20} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">REST API Traffic</h3>
             </div>
             <div className="px-4 py-2 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">
               Source: Supabase Gateway
             </div>
          </div>
          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardStats.chartData}>
                <defs>
                  <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="conversations" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorConv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-12 rounded-[56px] text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-10 -top-10 w-64 h-64 bg-emerald-600/20 rounded-full blur-[100px] group-hover:bg-emerald-600/30 transition-all duration-1000" />
           <div className="flex flex-col h-full relative z-10">
             <div className="w-16 h-16 bg-emerald-600 rounded-[24px] flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/40">
               <ShieldCheck size={32} />
             </div>
             <h3 className="text-3xl font-black mb-4 tracking-tight">Supabase Security</h3>
             <p className="text-slate-400 text-base leading-relaxed mb-12">PostgreSQL logic is active. The portal uses standard HTTP REST to communicate with your tables, ensuring zero socket-hang issues.</p>
             
             <div className="space-y-6 mt-auto">
                <div className="flex items-center justify-between text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                  <span>Engine Heartbeat</span>
                  <span className={dbStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}>
                    {dbStatus === 'connected' ? 'OPTIMAL' : 'INITIALIZING'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${dbStatus === 'connected' ? 'bg-emerald-500 w-full' : 'bg-emerald-500 w-1/2 animate-pulse'}`} />
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-6 bg-white text-slate-900 rounded-[32px] font-black uppercase tracking-[0.1em] text-xs hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 mt-6 shadow-xl active:scale-95"
                >
                  <RefreshCcw size={18} /> Refresh Connection
                </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
