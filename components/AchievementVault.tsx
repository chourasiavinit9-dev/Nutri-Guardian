
import React from 'react';
import { Trophy, Star, ShieldCheck, Zap, Sparkles, Target, Award, Heart, Flame, Crown, Medal, Hexagon, Fingerprint, Lock, Globe, Share2, Microscope } from 'lucide-react';

const AchievementCard = ({ title, description, icon: Icon, color, unlocked, date }: any) => (
  <div className={`bento-card p-8 relative overflow-hidden group transition-all duration-500 ${unlocked ? 'bg-white opacity-100 scale-100 shadow-xl' : 'bg-slate-50 opacity-60 grayscale'}`}>
    {unlocked && (
      <div className={`absolute -inset-1 ${color.bg} opacity-[0.03] blur-2xl group-hover:opacity-[0.08] transition-opacity`} />
    )}
    
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex justify-between items-start">
        <div className={`p-4 rounded-2xl ${unlocked ? `${color.light} ${color.text} shadow-lg shadow-${color.color}-100` : 'bg-slate-200 text-slate-400'}`}>
          <Icon size={24} strokeWidth={unlocked ? 2.5 : 2} />
        </div>
        {unlocked ? (
          <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
             <Fingerprint size={10} /> Verified
          </div>
        ) : (
          <Lock size={14} className="text-slate-300" />
        )}
      </div>
      
      <div className="mt-8 space-y-2">
        <h4 className="text-lg font-black text-slate-900 tracking-tight">{title}</h4>
        <p className="text-xs font-bold text-slate-500 leading-relaxed">{description}</p>
      </div>
      
      {unlocked && (
        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{date}</span>
           <button className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"><Share2 size={14} /></button>
        </div>
      )}
    </div>
    
    {unlocked && <Sparkles className="absolute -right-4 -top-4 text-emerald-500/10 group-hover:scale-125 transition-transform duration-700" size={80} />}
  </div>
);

const AchievementVault: React.FC = () => {
  const achievements = [
    { title: 'Sodium Sentinel', description: 'Maintained <1500mg sodium for 7 consecutive days.', icon: ShieldCheck, color: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', color: 'emerald' }, unlocked: true, date: 'Mar 24, 2026' },
    { title: 'Metabolic Master', description: 'Zero glycemic spikes detected across 15 audited meals.', icon: Zap, color: { bg: 'bg-amber-400', text: 'text-amber-600', light: 'bg-amber-50', color: 'amber' }, unlocked: true, date: 'Mar 26, 2026' },
    { title: 'Clinical Auditor', description: 'Performed 50 unique product scans with 100% adherence.', icon: Microscope, color: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', color: 'blue' }, unlocked: true, date: 'Mar 28, 2026' },
    { title: 'Renal Guardian', description: 'Maintained phosphorus/potassium ratios within clinical range for a month.', icon: Heart, color: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50', color: 'rose' }, unlocked: false },
    { title: 'Global Contributor', description: 'Contributed 10 new product entries to the clinical knowledge graph.', icon: Globe, color: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50', color: 'purple' }, unlocked: false },
    { title: 'Iron Genome', description: 'Achieved 100% nutrient variety across 30 distinct ingredients.', icon: Hexagon, color: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50', color: 'indigo' }, unlocked: false },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32 lg:pb-0">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Proof of Health Vault</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">Clinical Achievements</h2>
          <p className="text-slate-500 font-medium text-sm">Your verified health milestones recorded on the <span className="text-slate-900 font-bold">Health-Chain</span>.</p>
        </div>
        
        <div className="bg-slate-900 px-6 py-4 rounded-2xl flex items-center gap-6 shadow-xl">
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Vault Rank</span>
              <span className="text-sm font-black text-emerald-400">Elite Guardian</span>
           </div>
           <div className="w-px h-8 bg-slate-800" />
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Badges</span>
              <span className="text-sm font-black text-white">12 / 48</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {achievements.map((ach, i) => (
          <AchievementCard key={i} {...ach} />
        ))}
      </div>
      
      <div className="bento-card p-10 bg-white border-2 border-slate-100 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
         <div className="relative z-10 space-y-6 flex-1 text-center md:text-left">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Ready for your next audit?</h3>
            <p className="text-slate-500 font-medium text-sm max-w-md">Complete the **"Micronutrient Sprint"** to earn your next Soulbound Token and unlock advanced Clinical Lab features.</p>
            <button className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all transform hover:scale-105 active:scale-95">Enroll in Sprint</button>
         </div>
         <div className="w-48 h-48 rounded-[3rem] bg-slate-50 flex items-center justify-center relative shadow-inner shrink-0 scale-110">
            <Award size={80} className="text-slate-200" />
            <div className="absolute inset-0 border-4 border-emerald-500/10 rounded-[3rem] animate-pulse" />
         </div>
         <Sparkles className="absolute -left-10 -bottom-10 text-emerald-500/5 rotate-45" size={240} />
      </div>
    </div>
  );
};

export default AchievementVault;
