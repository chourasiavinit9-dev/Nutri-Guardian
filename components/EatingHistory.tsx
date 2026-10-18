
import React, { useMemo } from 'react';
import { EatingLog } from '../types';
import { History, Calendar, Utensils, Trash2, ArrowRight, ChevronRight, Activity, TrendingUp, Sparkles, Zap, Flame, Clock } from 'lucide-react';

interface EatingHistoryProps {
  logs: EatingLog[];
  onDelete: (id: string) => void;
}

const EatingHistory: React.FC<EatingHistoryProps> = ({ logs, onDelete }) => {
  const groupedLogs = useMemo(() => {
    const groups: { [date: string]: EatingLog[] } = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }, [logs]);

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => {
    return new Date(groupedLogs[b][0].timestamp).getTime() - new Date(groupedLogs[a][0].timestamp).getTime();
  });

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
              <History size={28} />
            </div>
            Clinical Consumption History
          </h2>
          <p className="text-slate-400 font-medium text-sm mt-2 px-1">Audited logs for long-term health monitoring.</p>
        </div>
        
        <div className="bg-white border border-slate-200 px-6 py-4 rounded-3xl shadow-sm flex items-center gap-6">
           <div className="text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Logs</p>
             <p className="text-lg font-black text-slate-900">{logs.length}</p>
           </div>
           <div className="w-px h-8 bg-slate-100" />
           <div className="text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Cal</p>
             <p className="text-lg font-black text-emerald-600">
               {logs.length > 0 ? (logs.reduce((acc, l) => acc + (l.calories || 0), 0) / logs.length).toFixed(0) : 0}
             </p>
           </div>
        </div>
      </div>

      <div className="space-y-12">
        {sortedDates.length > 0 ? sortedDates.map(date => {
          const dateLogs = groupedLogs[date];
          const dailyTotalCal = dateLogs.reduce((acc, l) => acc + (l.calories || 0), 0);
          const dailyTotalSodium = dateLogs.reduce((acc, l) => acc + (l.sodium || 0), 0);

          return (
            <div key={date} className="space-y-6">
              <div className="flex justify-between items-center px-2">
                 <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-slate-300" />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{date}</h3>
                 </div>
                 <div className="flex gap-4">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{dailyTotalCal} kcal</span>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{dailyTotalSodium}mg sodium</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {dateLogs.map(log => (
                  <div key={log.id} className="bento-card p-6 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center group hover:border-emerald-200 transition-all border-slate-100 gap-6">
                    <div className="flex items-center gap-5 flex-1">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all shadow-inner">
                        <Utensils size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-black text-slate-900 leading-none">{log.name}</h4>
                          <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                            <Clock size={10} /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <div className="flex items-center gap-1">
                             <Flame size={12} className="text-emerald-500" />
                             <span className="text-[10px] font-black text-slate-500 uppercase">{log.calories || 0} kcal</span>
                          </div>
                          <div className="flex items-center gap-1">
                             <Activity size={12} className="text-emerald-500" />
                             <span className="text-[10px] font-black text-slate-500 uppercase">{log.sodium}mg sodium</span>
                          </div>
                          <div className="flex items-center gap-1">
                             <TrendingUp size={12} className="text-amber-500" />
                             <span className="text-[10px] font-black text-slate-500 uppercase">{log.sugar}g sugar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                       <div className="flex-1 sm:text-right space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Outcome</p>
                          <div className="flex items-center sm:justify-end gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                             <span className="text-[11px] font-black text-slate-800">Verified Audit</span>
                          </div>
                       </div>
                       <button 
                        onClick={() => onDelete(log.id)}
                        className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete entry"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }) : (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 opacity-30">
            <div className="p-10 bg-slate-50 rounded-full">
              <History size={64} className="text-slate-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Clinical Log Empty</h3>
              <p className="text-sm font-medium text-slate-400 max-w-xs">Start scanning labels or logging pantry meals to build your health history.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EatingHistory;
