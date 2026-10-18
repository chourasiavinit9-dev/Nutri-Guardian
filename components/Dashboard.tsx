
import React, { useMemo } from 'react';
import { UserProfile, HealthBudget, SavedComparison, EatingLog } from '../types';
// Added Star to the imports from lucide-react
import { Heart, Activity, User, Info, TrendingUp, ShieldAlert, History, ArrowRight, ShieldCheck, Zap, Sparkles, RotateCcw, Target, Scale, Ruler, LayoutDashboard, ChevronRight, Utensils, RefreshCw, Clock, Flame, Award, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculateStreaks, getWeeklyAnalytics } from '../utils/logicEngine';
import IbmZRealtimeBentoCard from './IbmZRealtimeBentoCard';

interface DashboardProps {
  pct?: number;
  label?: string;
  value?: number;
  max?: number;
  unit?: string;
  icon?: any;
  color?: any;
}

const MetricCard = ({ pct, label, value, max, unit, icon: Icon, color }: any) => {
  const normalizedPct = Math.min(100, pct);
  return (
    <div className="bento-card p-6 flex flex-col justify-between group">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${color.light} ${color.text} transition-all duration-300 group-hover:scale-110 shadow-sm`}>
          <Icon size={20} />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</span>
          <div className="text-xl font-black text-slate-900 leading-none">
            {value}<span className="text-[10px] ml-0.5 text-slate-400 font-bold">{unit}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Consumption</span>
          <span className={`text-[11px] font-black ${color.text}`}>{normalizedPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-full ${color.bg}`} 
            style={{ width: `${normalizedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

interface DashboardComponentProps {
  profile: UserProfile;
  budget: HealthBudget;
  savedComparisons: SavedComparison[];
  onReset: () => void;
  logs: EatingLog[];
}

const Dashboard: React.FC<DashboardComponentProps> = ({ profile, budget, savedComparisons, onReset, logs }) => {
  const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
  
  const streaks = useMemo(() => calculateStreaks(logs), [logs]);
  const weekly = useMemo(() => getWeeklyAnalytics(logs), [logs]);

  const dailyHealthScore = Math.max(0, Math.min(100, 100 - (
    (budget.sodium.used / budget.sodium.max * 40) + 
    (budget.sugar.used / budget.sugar.max * 40) +
    (budget.protein.used > budget.protein.max ? 10 : 0)
  ) + (budget.vitamins.used / 5))).toFixed(0);

  const stats = [
    { label: 'Sodium', value: budget.sodium.used, max: budget.sodium.max, unit: 'mg', pct: (budget.sodium.used / budget.sodium.max * 100), icon: Activity, color: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' } },
    { label: 'Sugar', value: budget.sugar.used, max: budget.sugar.max, unit: 'g', pct: (budget.sugar.used / budget.sugar.max * 100), icon: TrendingUp, color: { bg: 'bg-amber-400', text: 'text-amber-600', light: 'bg-amber-50' } },
    { label: 'Protein', value: budget.protein.used, max: budget.protein.max, unit: 'g', pct: (budget.protein.used / budget.protein.max * 100), icon: Zap, color: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' } },
    { label: 'Micros', value: budget.vitamins.used, max: 100, unit: '%', pct: budget.vitamins.used, icon: Sparkles, color: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' } },
  ];

  const recentLogs = logs.slice(0, 3);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bento-card p-10 bg-slate-900 text-white relative overflow-hidden group border-none shadow-2xl">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Live Health Diagnostic</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight leading-tight">Patient Snapshot</h2>
                <p className="text-slate-400 font-medium text-sm max-w-sm">Monitoring <span className="text-white font-bold">{profile.chronicDisease}</span> guardrails.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Health Score</span>
                  <div className="text-5xl font-black text-emerald-400 flex items-baseline">
                    {dailyHealthScore}<span className="text-lg text-slate-600 ml-1">/100</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 flex gap-4">
               <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md flex-1">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Weekly Avg Sodium</p>
                 <p className="text-sm font-bold text-emerald-400">{weekly.avgSodium}mg</p>
               </div>
               <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md flex-1">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Daily Log Streak</p>
                 <div className="flex items-center gap-2">
                    <Award size={14} className="text-amber-400" />
                    <p className="text-sm font-bold text-white">{streaks.logging} Days</p>
                 </div>
               </div>
            </div>
          </div>
          <Sparkles className="absolute -right-16 -bottom-16 text-emerald-500/10 transition-transform duration-1000 group-hover:scale-110" size={320} />
        </div>

        <div className="bento-card p-8 flex flex-col justify-between bg-white">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Body Composition</h4>
              <Scale size={18} className="text-slate-300" />
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                <span className="text-xs font-bold text-slate-500">BMI</span>
                <span className={`text-sm font-black ${parseFloat(bmi) < 25 ? 'text-emerald-600' : 'text-amber-600'}`}>{bmi}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                <span className="text-xs font-bold text-slate-500">Status</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">Normal Range</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Clock className="w-4 h-4" /></div>
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compliance Streak</span>
                <span className="text-[10px] font-bold text-slate-600">{streaks.compliance} Uninterrupted Days</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <MetricCard key={i} {...stat} />
        ))}
      </div>
      
      {/* IBM LinuxONE s390x Real-Time Decision Engine — IBM Z Datathon 2026 */}
      <div className="grid grid-cols-1 gap-6">
        <IbmZRealtimeBentoCard
          patientGlucose={undefined}
          patientEgfr={undefined}
          patientPotassium={undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bento-card p-10 bg-white">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Activity</h4>
            <Link to="/history" className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-1">Full Report <ChevronRight size={14} /></Link>
          </div>
          <div className="space-y-4">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <div key={log.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl text-slate-400 group-hover:text-emerald-500 transition-colors shadow-sm">
                    <Utensils size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{log.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900">{log.sodium}mg</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sodium</p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-300 font-bold text-[10px] uppercase">No recent activity</div>
            )}
          </div>
        </div>

        <div className="bento-card p-10 bg-white">
           <div className="flex justify-between items-center mb-8">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Archived Comparisons</h4>
             <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">View All</button>
           </div>
           <div className="space-y-4">
             {savedComparisons.length > 0 ? savedComparisons.slice(0, 3).map((comp) => (
               <div key={comp.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition-all">
                  <div className="flex justify-between items-start mb-3">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(comp.timestamp).toLocaleDateString()}</p>
                     <div className="flex gap-1">
                        {/* Fixed: Added 'Star' to imports above */}
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-black text-slate-900">{comp.product1Score}/5</span>
                     </div>
                  </div>
                  <h5 className="text-xs font-black text-slate-800 mb-1">{comp.product1Name} vs {comp.product2Name}</h5>
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     <p className="text-[10px] font-bold text-emerald-600 truncate">Winner: {comp.winner}</p>
                  </div>
               </div>
             )) : (
               <div className="py-12 text-center text-slate-300 font-bold text-[10px] uppercase">No archived data</div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
