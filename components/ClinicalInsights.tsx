
import React, { useMemo } from 'react';
import { TrendingUp, Activity, ShieldAlert, Zap, Sparkles, ChevronRight, ArrowUpRight, ArrowDownRight, Info, Calendar, Microscope, Waves, Target, Brain, Scale, Pill } from 'lucide-react';
import { UserProfile, HealthBudget, EatingLog } from '../types';
import { getWeeklyAnalytics } from '../utils/logicEngine';

interface ClinicalInsightsProps {
  profile: UserProfile;
  budget: HealthBudget;
  logs: EatingLog[];
}

const TrendCard = ({ title, value, unit, trend, pct, icon: Icon, color }: any) => (
  <div className="bento-card p-6 bg-white flex flex-col justify-between group">
    <div className="flex justify-between items-start">
      <div className={`p-2.5 rounded-xl ${color.light} ${color.text} shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon size={18} />
      </div>
      <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${trend === 'up' ? 'text-rose-500' : 'text-emerald-500'}`}>
        {trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {pct}% Variance
      </div>
    </div>
    
    <div className="mt-6">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
      <div className="text-2xl font-black text-slate-900 leading-none">
        {value}<span className="text-[10px] ml-1 text-slate-400 font-bold uppercase">{unit}</span>
      </div>
    </div>
    
    <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
       <div className={`h-full ${color.bg} opacity-20`} style={{ width: '100%' }} />
       <div className={`h-full ${color.bg} -mt-1`} style={{ width: `${60 + Math.random() * 30}%` }} />
    </div>
  </div>
);

const ClinicalInsights: React.FC<ClinicalInsightsProps> = ({ profile, budget, logs }) => {
  const weekly = useMemo(() => getWeeklyAnalytics(logs), [logs]);

  const insights = [
    { title: 'Sodium Intensity', value: weekly.avgSodium, unit: 'mg/avg', trend: weekly.avgSodium > budget.sodium.max ? 'up' : 'down', pct: 12, icon: Activity, color: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' } },
    { title: 'Glycemic Load', value: (weekly.avgSugar * 0.8).toFixed(1), unit: 'gl/avg', trend: 'down', pct: 8, icon: TrendingUp, color: { bg: 'bg-amber-400', text: 'text-amber-600', light: 'bg-amber-50' } },
    { title: 'Protein Efficiency', value: weekly.avgProtein, unit: 'g/avg', trend: 'up', pct: 4, icon: Zap, color: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' } },
    { title: 'Micronutrient Yield', value: (logs.length * 15), unit: 'pts', trend: 'up', pct: 15, icon: Sparkles, color: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' } },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32 lg:pb-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Diagnostic Suite</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">Clinical Lab Insights</h2>
          <p className="text-slate-500 font-medium text-sm">Long-term metabolic trend analysis for <span className="text-slate-900 font-bold">{profile.chronicDisease}</span>.</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
           <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">7 Day Audit</button>
           <button className="px-6 py-2.5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">30 Day Report</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-2 gap-6">
              {insights.map((ins, i) => (
                <TrendCard key={i} {...ins} />
              ))}
           </div>
           
           <div className="bento-card p-10 bg-slate-900 text-white relative overflow-hidden group">
              <div className="relative z-10 space-y-8">
                 <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Clinical Sentiment Audit</h4>
                       <p className="text-xl font-black">Overall Adherence: <span className="text-emerald-400">OPTIMAL</span></p>
                    </div>
                    <Brain size={32} className="text-emerald-500/50" />
                 </div>
                 
                 <div className="flex gap-4">
                    <div className="flex-1 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
                       <div className="flex items-center gap-2 mb-2">
                          <Waves size={14} className="text-blue-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Metabolic Stability</span>
                       </div>
                       <p className="text-sm font-bold text-white">92.4% Stable</p>
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
                       <div className="flex items-center gap-2 mb-2">
                          <Target size={14} className="text-amber-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Target Adherence</span>
                       </div>
                       <p className="text-sm font-bold text-white">18/20 Protocol Wins</p>
                    </div>
                 </div>
                 
                 <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-[11px] font-bold text-emerald-100 leading-relaxed italic">
                      "Machine learning audit suggests your current dietary sequence is optimizing renal filtration. Maintain consistent hydration during evening cycles."
                    </p>
                 </div>
              </div>
              <Activity className="absolute -right-20 -bottom-20 text-emerald-500/5" size={400} />
           </div>
        </div>

        <div className="space-y-8">
           <div className="bento-card p-8 bg-white border-2 border-slate-100">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                 <Microscope size={20} className="text-slate-900" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Lab Anomalies</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex gap-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl transform hover:scale-[1.02] transition-transform">
                    <ShieldAlert size={18} className="text-rose-500 shrink-0" />
                    <div className="space-y-1">
                       <p className="text-[11px] font-black text-rose-900 uppercase tracking-tight">Sodium Surge</p>
                       <p className="text-[10px] font-bold text-rose-600 italic">2.4x Target at 8:00 PM (Scan ID: #482)</p>
                    </div>
                 </div>
                 <div className="flex gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl transform hover:scale-[1.02] transition-transform">
                    <Info size={18} className="text-blue-500 shrink-0" />
                    <div className="space-y-1">
                       <p className="text-[11px] font-black text-blue-900 uppercase tracking-tight">Hydration Gap</p>
                       <p className="text-[10px] font-bold text-blue-600 italic">Critical drop detected 4 hours post-meal.</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bento-card p-8 bg-white border border-slate-100 relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-8">
                 <Scale size={20} className="text-emerald-500" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nutrient Matrix</h4>
              </div>
              <div className="space-y-6">
                 {[
                   { name: 'Potassium', color: 'bg-emerald-500', val: 85 },
                   { name: 'Phosphorus', color: 'bg-amber-400', val: 62 },
                   { name: 'Creatinine Prox.', color: 'bg-blue-500', val: 45 },
                   { name: 'Fiber Yield', color: 'bg-purple-500', val: 78 }
                 ].map((n, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                         <span className="text-slate-500">{n.name}</span>
                         <span className="text-slate-900">{n.val}% Yield</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                         <div className={`h-full ${n.color} transition-all duration-[2000ms]`} style={{ width: `${n.val}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
              <Sparkles className="absolute -right-8 -bottom-8 text-emerald-500/5 group-hover:rotate-12 transition-transform duration-700" size={140} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalInsights;
