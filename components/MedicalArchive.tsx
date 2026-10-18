
import React from 'react';
import { History, FileText, Download, ExternalLink, ShieldCheck, Activity, Search, Trash2, Filter, MoreVertical, Calendar, Clock, Microscope, ClipboardList, Share2, Sparkles } from 'lucide-react';
import { UserProfile, EatingLog } from '../types';

interface MedicalArchiveProps {
  profile: UserProfile;
  logs: EatingLog[];
  onDelete: (id: string) => void;
}

const AuditRecord = ({ log, onDelete }: any) => (
  <div className="bento-card p-6 bg-white border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-emerald-200 transition-all">
    <div className="flex gap-4 items-center flex-1 min-w-0">
      <div className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all shadow-inner">
        <Microscope size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-black text-slate-900 truncate tracking-tight">{log.name}</h4>
        <div className="flex items-center gap-3 mt-1">
           <span className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400 tracking-widest"><Calendar size={10} /> {new Date(log.timestamp).toLocaleDateString()}</span>
           <span className="w-1 h-1 rounded-full bg-slate-200" />
           <span className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400 tracking-widest"><Clock size={10} /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-8 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
       <div className="flex flex-col items-center px-4 border-r border-slate-100">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sodium</span>
          <span className="text-xs font-black text-slate-800">{log.sodium}mg</span>
       </div>
       <div className="flex flex-col items-center px-4 border-r border-slate-100">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sugar</span>
          <span className="text-xs font-black text-slate-800">{log.sugar}g</span>
       </div>
       <div className="flex flex-col items-center px-4 border-r border-slate-100">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Protein</span>
          <span className="text-xs font-black text-slate-800">{log.protein}g</span>
       </div>
       <div className="flex items-center gap-2">
          <button className="p-2.5 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Share Report"><Share2 size={16} /></button>
          <button onClick={() => onDelete(log.id)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Archive Recored"><Trash2 size={16} /></button>
       </div>
    </div>
  </div>
);

const MedicalArchive: React.FC<MedicalArchiveProps> = ({ profile, logs, onDelete }) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32 lg:pb-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2.5 bg-slate-900 rounded-lg text-emerald-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
               <History size={10} /> Audit Vault
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Data Archive</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">Medical Repository</h2>
          <p className="text-slate-500 font-medium text-sm">Review clinical history and download verified nutritional reports.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                placeholder="Search audit trail..." 
                className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-xs font-bold focus:border-emerald-200 outline-none transition-all shadow-sm"
              />
           </div>
           <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-500 shadow-sm"><Filter size={18} /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           {logs.length > 0 ? logs.map(log => (
             <AuditRecord key={log.id} log={log} onDelete={onDelete} />
           )) : (
             <div className="bento-card bg-white p-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-200"><ClipboardList size={32} /></div>
                <h4 className="text-xl font-black text-slate-900 mb-2">The Vault is empty</h4>
                <p className="text-sm text-slate-400 font-medium max-w-xs">Start auditing your nutrition through the scanner to build your clinical history.</p>
             </div>
           )}
        </div>

        <div className="space-y-8">
           <div className="bento-card p-10 bg-slate-900 text-white relative overflow-hidden group border-none shadow-2xl">
              <div className="relative z-10 space-y-8">
                 <div className="space-y-2">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Global Report Engine</p>
                    <h3 className="text-2xl font-black tracking-tight">Generate Clinical Summary</h3>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Export a multi-page PDF summary encompassing your 30-day nutrition markers and clinical sentiment.</p>
                 </div>
                 
                 <div className="space-y-3">
                    <button className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-200/20 flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-all">
                       <FileText size={16} /> Export JSON Data
                    </button>
                    <button className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                       <Download size={16} /> Batch Download Logs
                    </button>
                 </div>
              </div>
              <Activity className="absolute -right-16 -bottom-16 text-emerald-500/5 transition-transform duration-700 group-hover:rotate-12" size={240} />
           </div>

           <div className="bento-card p-8 bg-white border border-slate-100 flex items-center gap-6 group">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                 <ShieldCheck size={28} />
              </div>
              <div className="flex-1 space-y-1">
                 <h4 className="text-xs font-black text-slate-900 tracking-tight">Encryption Active</h4>
                 <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-0">Internal clinical data is stored in localized secure storage with zero cloud leaks.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalArchive;
