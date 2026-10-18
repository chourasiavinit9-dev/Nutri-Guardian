import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Scan, User, ShieldCheck, Menu, X, Apple, RotateCcw, Activity, LayoutDashboard, Search, Bell, Loader2, Sparkles, ArrowRight, ShieldAlert, History, Volume2, BookmarkPlus, CheckCircle2, Stethoscope, Utensils, ExternalLink, Zap, Info, Download, Trash2, Clock, Trophy, Moon, Sun } from 'lucide-react';
import { UserProfile, ChronicDisease, HealthBudget, SavedComparison, SavedMeal, AnalysisResult, EatingLog } from './types';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import FridgeManager from './components/FridgeManager';
import ProfileSettings from './components/ProfileSettings';
import SymptomChecker from './components/SymptomChecker';
import EatingHistory from './components/EatingHistory';
import { DISEASE_GUARDRAILS } from './constants';
import { searchAndAnalyzeProduct } from './geminiService';
import { searchLocalData } from './utils/logicEngine';
import { exportClinicalReport } from './utils/reportGenerator';
import ClinicalInsights from './components/ClinicalInsights';
import AchievementVault from './components/AchievementVault';
import MedicalArchive from './components/MedicalArchive';

const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link to={to} className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'scale-105' : 'hover:scale-105'} ${active ? 'min-w-[56px]' : 'min-w-[40px] sm:min-w-[48px]'}`}>
    <div className={`p-2.5 sm:p-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-500'}`}>
      <Icon size={active ? 20 : 18} strokeWidth={active ? 2.5 : 2} />
    </div>
    {/* On mobile: show label only for active item. On sm+: always show label */}
    <span className={`text-[9px] sm:text-[10px] font-bold tracking-wide transition-colors duration-300 ${active ? 'text-emerald-600 block' : 'text-slate-400 dark:text-slate-500 hidden sm:block'}`}>
      {label}
    </span>
  </Link>
);

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ── Dark Mode ──────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('nutri_dark_mode');
    return stored ? stored === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nutri_dark_mode', String(darkMode));
  }, [darkMode]);
  // ────────────────────────────────────────────────────────────────────

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('nutri_guardian_profile');
    return saved ? JSON.parse(saved) : {
      weight: 72,
      height: 175,
      age: 42,
      chronicDisease: ChronicDisease.DIABETES
    };
  });

  const [budget, setBudget] = useState<HealthBudget>(() => {
    const saved = localStorage.getItem('nutri_guardian_budget');
    return saved ? JSON.parse(saved) : {
      calories: { max: 2000, used: 0 },
      sodium: { max: 2300, used: 0 },
      sugar: { max: 10, used: 0 },
      protein: { max: 70, used: 0 },
      vitamins: { max: 100, used: 0 }
    };
  });

  const [logs, setLogs] = useState<EatingLog[]>(() => {
    const saved = localStorage.getItem('nutri_guardian_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [fridge, setFridge] = useState<string[]>(() => {
    const saved = localStorage.getItem('nutri_guardian_fridge');
    return saved ? JSON.parse(saved) : ['Greek Yogurt', 'Avocado', 'Almonds', 'Baby Spinach', 'Salmon', 'Quinoa'];
  });

  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>(() => {
    const saved = localStorage.getItem('nutri_guardian_comparisons');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>(() => {
    const saved = localStorage.getItem('nutri_guardian_meals');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, title: string, body: string, time: string, type: 'warning' | 'info' | 'success'}[]>([]);

  // PERSISTENCE EFFECT
  useEffect(() => {
    localStorage.setItem('nutri_guardian_profile', JSON.stringify(profile));
    localStorage.setItem('nutri_guardian_budget', JSON.stringify(budget));
    localStorage.setItem('nutri_guardian_logs', JSON.stringify(logs));
    localStorage.setItem('nutri_guardian_fridge', JSON.stringify(fridge));
    localStorage.setItem('nutri_guardian_comparisons', JSON.stringify(savedComparisons));
    localStorage.setItem('nutri_guardian_meals', JSON.stringify(savedMeals));
  }, [profile, budget, logs, fridge, savedComparisons, savedMeals]);

  // CLINICAL REMINDER SYSTEM
  useEffect(() => {
    const reminderInterval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      
      // Hydration Check
      if (hour >= 9 && hour <= 21 && Math.random() > 0.90) {
        setNotifications(prev => [
          { id: Date.now().toString(), title: 'Hydration Audit', body: 'Renal filtration requires fluid. Consumption of 250ml water recommended.', time: 'Just now', type: 'info' },
          ...prev.slice(0, 5)
        ]);
      }
      
      // Post-Meal Walk Reminder (If log exists in last hour)
      const lastLog = logs[0];
      if (lastLog && (Date.now() - lastLog.timestamp < 3600000) && Math.random() > 0.7) {
        setNotifications(prev => [
          { id: Date.now().toString(), title: 'Post-Meal Protocol', body: 'Activity detected 60m ago. A 10min walk will optimize glucose absorption.', time: 'System Alert', type: 'success' },
          ...prev.slice(0, 5)
        ]);
      }
    }, 60000 * 45); // Check every 45 mins
    return () => clearInterval(reminderInterval);
  }, [logs]);

  const localSearchResults = useMemo(() => {
    return searchLocalData(searchQuery, { logs, fridge, meals: savedMeals });
  }, [searchQuery, logs, fridge, savedMeals]);

  const addConsumption = (name: string, sodium: number, sugar: number, protein: number = 0, vitamins: number = 0, calories: number = 0) => {
    const newLog: EatingLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      name,
      sodium,
      sugar,
      protein,
      vitamins,
      calories
    };
    setLogs(prev => [newLog, ...prev]);
    setBudget(prev => ({
      ...prev,
      calories: { ...prev.calories, used: prev.calories.used + calories },
      sodium: { ...prev.sodium, used: Math.min(prev.sodium.max * 2, prev.sodium.used + sodium) },
      sugar: { ...prev.sugar, used: Math.min(prev.sugar.max * 2, prev.sugar.used + sugar) },
      protein: { ...prev.protein, used: Math.min(prev.protein.max * 2, prev.protein.used + protein) },
      vitamins: { ...prev.vitamins, used: Math.min(prev.vitamins.max, prev.vitamins.used + vitamins) } 
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    // Silent background fetch for AI result if needed, otherwise local results are already memoized.
    setTimeout(() => setIsSearching(false), 800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col font-['Plus_Jakarta_Sans'] pb-32 lg:pb-0 transition-colors duration-300">
      <header className="sticky top-0 z-50 glass border-b border-slate-200/60 dark:border-slate-700/60 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg">
              <ShieldCheck className="text-white" size={22} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">Nutri-Guardian</h1>
              <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Clinical Suite</p>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => exportClinicalReport(profile, budget, logs)}
            className="p-2.5 text-slate-400 hover:text-emerald-600 rounded-xl transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            title="Export Report"
          >
            <Download size={18} />
          </button>
          <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1.5 items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{profile.chronicDisease} Monitoring</span>
          </div>
          <div className="flex gap-2">
            <Link to="/insights" className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-emerald-500 transition-colors" title="Clinical Insights"><Activity size={18} /></Link>
            <Link to="/achievements" className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-amber-500 transition-colors" title="Achievements"><Trophy size={18} /></Link>
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(d => !d)}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => { setIsSearchOpen(true); setIsNotificationsOpen(false); }}
              className="p-2.5 text-slate-400 hover:text-emerald-500 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <Search size={18} />
            </button>
            <button 
              onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsSearchOpen(false); }}
              className={`p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl relative ${isNotificationsOpen ? 'text-emerald-500' : 'text-slate-400'}`}
            >
              <Bell size={18} />
              {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
            </button>
          </div>
        </div>
      </header>

      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-white/70 dark:bg-slate-900/80">
          <div className="w-full max-w-2xl animate-in zoom-in duration-300 flex flex-col gap-6">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-black text-slate-900 dark:text-white">Clinical Database Search</h2>
               <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300"><X size={24} /></button>
             </div>
             <form onSubmit={handleSearchSubmit} className="relative">
                <input 
                  autoFocus
                  placeholder="Query logs, pantry, or saved meals..."
                  className="w-full bg-white dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 border-2 border-transparent rounded-[2rem] py-6 px-10 text-xl font-bold shadow-2xl focus:border-emerald-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </form>

             {searchQuery.trim() && (
               <div className="bg-white/60 dark:bg-slate-800/80 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-8 max-h-[60vh] overflow-y-auto space-y-8 custom-scrollbar">
                 {localSearchResults.logs.length > 0 && (
                   <div className="space-y-3">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audit History</p>
                     {localSearchResults.logs.map(log => (
                       <div key={log.id} className="p-4 bg-white dark:bg-slate-700 rounded-2xl flex justify-between items-center shadow-sm">
                         <div className="flex items-center gap-3">
                           <History size={16} className="text-slate-300" />
                           <span className="text-sm font-bold text-slate-900 dark:text-white">{log.name}</span>
                         </div>
                         <span className="text-[10px] font-black text-emerald-500">{log.sodium}mg Sodium</span>
                       </div>
                     ))}
                   </div>
                 )}
                 {localSearchResults.meals.length > 0 && (
                   <div className="space-y-3">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saved Protocols</p>
                     {localSearchResults.meals.map(m => (
                       <div key={m.id} className="p-4 bg-white dark:bg-slate-700 rounded-2xl flex justify-between items-center shadow-sm">
                         <div className="flex items-center gap-3">
                           <Utensils size={16} className="text-emerald-400" />
                           <span className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</span>
                         </div>
                         <div className="flex gap-1">
                           {[1,2,3,4,5].map(s => <div key={s} className={`w-1 h-1 rounded-full ${s <= m.clinicalScore ? 'bg-amber-400' : 'bg-slate-100'}`} />)}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
                 {localSearchResults.fridge.length > 0 && (
                   <div className="space-y-3">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pantry Inventory</p>
                     <div className="flex flex-wrap gap-2">
                       {localSearchResults.fridge.map((item, i) => (
                         <span key={i} className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300">{item}</span>
                       ))}
                     </div>
                   </div>
                 )}
                 {localSearchResults.logs.length === 0 && localSearchResults.meals.length === 0 && localSearchResults.fridge.length === 0 && (
                   <div className="py-12 text-center text-slate-300 font-bold text-[10px] uppercase">No Clinical Matches Found</div>
                 )}
               </div>
             )}
          </div>
        </div>
      )}

      {isNotificationsOpen && (
        <div className="fixed top-24 right-6 w-full max-w-sm z-[100] animate-in slide-in-from-top-4 duration-300">
           <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Health Alerts</h4>
                 <button onClick={() => setIsNotificationsOpen(false)}><X size={16} className="text-slate-300" /></button>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {notifications.map(notif => (
                   <div key={notif.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex gap-4">
                      <div className={`p-2 rounded-xl h-fit ${notif.type === 'info' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        <Bell size={16} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white">{notif.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{notif.body}</p>
                      </div>
                   </div>
                ))}
              </div>
           </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 lg:p-12">
        <Routes>
          <Route path="/" element={<Dashboard profile={profile} budget={budget} savedComparisons={savedComparisons} onReset={() => setLogs([])} logs={logs} />} />
          <Route path="/scan" element={<Scanner profile={profile} onConsume={(sodium, sugar, protein, vitamins, calories, name) => addConsumption(name, sodium, sugar, protein, vitamins, calories)} onSaveComparison={(c) => setSavedComparisons(prev => [{...c, id: Math.random().toString(), timestamp: Date.now()}, ...prev])} onSaveMeal={(m) => setSavedMeals(prev => [{...m, id: Date.now().toString(), timestamp: Date.now()}, ...prev])} />} />
          <Route path="/fridge" element={
            <FridgeManager 
              profile={profile} 
              fridge={fridge} 
              setFridge={setFridge} 
              onLogMeal={(sodium, sugar, protein, vitamins, calories, name) => addConsumption(name, sodium, sugar, protein, vitamins, calories)} 
              savedMeals={savedMeals}
              onSaveMeal={(m) => setSavedMeals(prev => [{...m, id: Date.now().toString(), timestamp: Date.now()}, ...prev])}
              onRemoveMeal={(id) => setSavedMeals(prev => prev.filter(m => m.id !== id))}
            />
          } />
          <Route path="/symptoms" element={<SymptomChecker profile={profile} />} />
          <Route path="/history" element={<EatingHistory logs={logs} onDelete={(id) => setLogs(l => l.filter(log => log.id !== id))} />} />
          <Route path="/profile" element={<ProfileSettings profile={profile} setProfile={setProfile} darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/insights" element={<ClinicalInsights profile={profile} budget={budget} logs={logs} />} />
          <Route path="/achievements" element={<AchievementVault />} />
          <Route path="/archive" element={<MedicalArchive profile={profile} logs={logs} onDelete={(id) => setLogs(l => l.filter(log => log.id !== id))} />} />
        </Routes>
      </main>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[96%] max-w-2xl glass border border-white/50 dark:border-slate-700/50 shadow-2xl rounded-[2rem] flex justify-around items-center py-2.5 sm:py-3.5 px-1 sm:px-2 z-50">
        <NavItem to="/" icon={LayoutDashboard} label="Hub" active={location.pathname === '/'} />
        <NavItem to="/scan" icon={Scan} label="Scan" active={location.pathname === '/scan'} />
        <NavItem to="/history" icon={History} label="Logs" active={location.pathname === '/history'} />
        <NavItem to="/symptoms" icon={Stethoscope} label="Consult" active={location.pathname === '/symptoms'} />
        <NavItem to="/fridge" icon={Apple} label="Pantry" active={location.pathname === '/fridge'} />
        <NavItem to="/profile" icon={User} label="Me" active={location.pathname === '/profile'} />
      </nav>
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;