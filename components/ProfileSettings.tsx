import React, { useState, useEffect } from 'react';
import { UserProfile, ChronicDisease } from '../types';
import { User, Scale, Ruler, Calendar, ShieldCheck, Save, ClipboardEdit, AlertCircle, CheckCircle2, Info, Sparkles, Zap, ArrowRight, Lightbulb, RefreshCw, Loader2, Plus, Moon, Sun } from 'lucide-react';
import { refineClinicalRestrictions } from '../geminiService';

interface ProfileProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const CLINICAL_TEMPLATES = [
  { name: 'Gout', restrictions: 'Avoid high-purine foods, organ meats, and high-fructose corn syrup. Monitor hydration.' },
  { name: 'Celiac Disease', restrictions: 'Strict gluten-free. Flag any traces of wheat, barley, rye, or cross-contamination risks.' },
  { name: 'IBS (Low FODMAP)', restrictions: 'Avoid high-FODMAP triggers like onion, garlic, wheat, and certain legumes. Focus on easy-to-digest fibers.' },
  { name: 'Gestational Diabetes', restrictions: 'Strict carbohydrate monitoring. Flag added sugars and prioritize low-glycemic index options.' }
];

const CLINICAL_CATEGORIES = [
  {
    label: 'Exclusions',
    chips: ['Gluten-Free', 'Dairy-Free', 'Nut-Free', 'No Added Sugars', 'No Palm Oil', 'No MSG']
  },
  {
    label: 'Clinical Targets',
    chips: ['Low Sodium', 'Low Glycemic', 'Low Potassium', 'Low Phosphorus', 'Low Purine']
  },
  {
    label: 'Dietary Patterns',
    chips: ['Keto', 'Paleo', 'Vegan', 'Plant-Based', 'High Protein', 'DASH Diet']
  }
];

const VALIDATION_RULES = {
  weight: { min: 10, max: 500, label: 'Weight' },
  height: { min: 50, max: 250, label: 'Height' },
  age: { min: 1, max: 120, label: 'Age' }
};

const ProfileSettings: React.FC<ProfileProps> = ({ profile, setProfile, darkMode = false, setDarkMode }) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isRefining, setIsRefining] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: number) => {
    const rules = VALIDATION_RULES[field as keyof typeof VALIDATION_RULES];
    if (!rules) return '';
    
    if (isNaN(value) || value === null) return `${rules.label} is required`;
    if (value < rules.min) return `${rules.label} must be at least ${rules.min}`;
    if (value > rules.max) return `${rules.label} cannot exceed ${rules.max}`;
    return '';
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    if (field === 'weight' || field === 'height' || field === 'age') {
      const error = validateField(field, Number(value));
      setErrors(prev => ({ ...prev, [field]: error }));
    }
    
    setProfile({ ...profile, [field]: value });
    if (saveStatus === 'saved') setSaveStatus('idle');
  };

  const handleSave = () => {
    // Final validation check
    const newErrors: Record<string, string> = {
      weight: validateField('weight', profile.weight),
      height: validateField('height', profile.height),
      age: validateField('age', profile.age)
    };

    const hasErrors = Object.values(newErrors).some(err => err !== '');
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
    }, 800);
  };

  const applyTemplate = (tpl: typeof CLINICAL_TEMPLATES[0]) => {
    setProfile({
      ...profile,
      customDiseaseName: tpl.name,
      customRestrictions: tpl.restrictions
    });
  };

  const addChip = (chip: string) => {
    const current = profile.customRestrictions || '';
    const cleanChip = chip.trim();
    if (!current.toLowerCase().split(',').map(s => s.trim()).includes(cleanChip.toLowerCase())) {
      const updated = current ? `${current.trim()}, ${cleanChip}` : cleanChip;
      handleChange('customRestrictions', updated);
    }
  };

  const handleRefine = async () => {
    if (!profile.customRestrictions || isRefining) return;
    setIsRefining(true);
    try {
      const refined = await refineClinicalRestrictions(profile.customRestrictions);
      handleChange('customRestrictions', refined);
      setAiTip("AI refined your criteria for maximum auditor precision.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  const getClarityLevel = () => {
    const text = profile.customRestrictions || '';
    if (text.length === 0) return { label: 'Incomplete', color: 'bg-slate-200', text: 'text-slate-400', width: 'w-0', tip: 'Start by describing your dietary needs.' };
    if (text.length < 25) return { label: 'Vague', color: 'bg-amber-400', text: 'text-amber-600', width: 'w-1/3', tip: 'Try adding specific ingredients to avoid.' };
    if (text.length < 70) return { label: 'Actionable', color: 'bg-blue-400', text: 'text-blue-600', width: 'w-2/3', tip: 'Good details. AI will detect these triggers.' };
    return { label: 'Clinical-Grade', color: 'bg-[#10B981]', text: 'text-emerald-600', width: 'w-full', tip: 'Excellent clarity. Auditor performance optimized.' };
  };

  const clarity = getClarityLevel();
  const isInvalid = Object.values(errors).some(err => err !== '');

  useEffect(() => {
    setAiTip(clarity.tip);
  }, [profile.customRestrictions]);

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* ─── Dark Mode Card ───────────────────────────────────────── */}
      <div className="bento-card p-6 bg-white dark:bg-slate-800 shadow-xl border-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-500'}`}>
              {darkMode ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Dark Mode</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{darkMode ? 'Dark theme active' : 'Light theme active'}</p>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            onClick={() => setDarkMode && setDarkMode(d => !d)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${
              darkMode ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      {/* ────────────────────────────────────────────────────────── */}

      <div className="bento-card p-10 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-none space-y-12">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-[#10B981] mb-6 ring-8 ring-emerald-50/50 shadow-inner group">
            <User size={48} className="group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Clinical Profile</h2>
          <p className="text-slate-400 font-medium text-sm">Personalize guardrails for your unique needs</p>
        </div>

        <div className="space-y-10">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block px-1">Chronic Condition Selection</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(ChronicDisease).map((disease) => (
                <button
                  key={disease}
                  onClick={() => handleChange('chronicDisease', disease)}
                  className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all text-left group relative overflow-hidden ${
                    profile.chronicDisease === disease 
                    ? 'border-[#10B981] bg-emerald-50 text-[#10B981]' 
                    : 'border-slate-50 text-slate-400 hover:border-emerald-100 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-extrabold text-sm relative z-10">{disease}</span>
                  {profile.chronicDisease === disease ? (
                    <CheckCircle2 size={22} className="relative z-10" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-100 relative z-10" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {profile.chronicDisease === ChronicDisease.CUSTOM && (
            <div className="space-y-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                  <ClipboardEdit size={16} className="text-[#10B981]" /> AI Auditor Readiness
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${clarity.text}`}>{clarity.label}</span>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${clarity.color} transition-all duration-500 ${clarity.width}`} />
                  </div>
                </div>
              </div>

              {aiTip && (
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100 flex items-start gap-3 shadow-sm animate-in fade-in zoom-in duration-300">
                  <Lightbulb size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{aiTip}</p>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1 tracking-widest">Disease / Intolerance Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Histamine Intolerance"
                    value={profile.customDiseaseName || ''}
                    onChange={(e) => handleChange('customDiseaseName', e.target.value)}
                    className="w-full bg-white border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:border-[#10B981] shadow-sm transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1 tracking-widest">Audit Logic & Exclusions</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe specific ingredients or nutrient limits the AI auditor must enforce..."
                    value={profile.customRestrictions || ''}
                    onChange={(e) => handleChange('customRestrictions', e.target.value)}
                    className="w-full bg-white border-2 border-transparent rounded-[1.5rem] py-4 px-6 text-sm font-bold focus:border-[#10B981] shadow-sm transition-all resize-none placeholder:text-slate-300 leading-relaxed pr-12"
                  />
                  <button 
                    onClick={handleRefine}
                    disabled={isRefining || !profile.customRestrictions}
                    className="absolute right-4 bottom-4 p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-[#10B981] disabled:bg-slate-200 transition-all active:scale-90 group"
                    title="Refine with AI"
                  >
                    {isRefining ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />}
                  </button>
                </div>

                <div className="space-y-6 pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Zap size={10} className="text-amber-500" /> Quick-Select Clinical Guardrails
                  </label>
                  {CLINICAL_CATEGORIES.map(category => (
                    <div key={category.label} className="space-y-2">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">{category.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {category.chips.map(chip => {
                          const isSelected = profile.customRestrictions?.toLowerCase().split(',').map(s => s.trim()).includes(chip.toLowerCase());
                          return (
                            <button
                              key={chip}
                              onClick={() => addChip(chip)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 border ${
                                isSelected 
                                ? 'bg-emerald-50 border-emerald-200 text-[#10B981] shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-[#10B981] hover:bg-emerald-50'
                              }`}
                            >
                              <Plus size={10} strokeWidth={3} className={isSelected ? 'hidden' : ''} />
                              {isSelected && <CheckCircle2 size={10} strokeWidth={3} />}
                              {chip}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block px-1 tracking-widest flex items-center gap-2">
                  <ArrowRight size={12} /> Diagnostic Templates
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CLINICAL_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      onClick={() => applyTemplate(tpl)}
                      className="bg-white/50 border border-slate-200 px-4 py-3 rounded-2xl text-left hover:border-emerald-200 hover:bg-white transition-all group shadow-sm"
                    >
                      <p className="text-[11px] font-black text-slate-800 group-hover:text-[#10B981]">{tpl.name}</p>
                      <p className="text-[9px] text-slate-400 font-medium line-clamp-1 mt-0.5">{tpl.restrictions}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="relative group">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1 tracking-widest">Weight (kg)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={profile.weight}
                    onChange={(e) => handleChange('weight', Number(e.target.value))}
                    className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-slate-900 focus:bg-white transition-all shadow-inner ${errors.weight ? 'border-rose-200 focus:border-rose-400' : 'border-transparent focus:border-emerald-100'}`}
                  />
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.weight ? 'text-rose-400' : 'text-slate-300'}`}>
                    <Scale size={20} />
                  </div>
                </div>
                {errors.weight && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1 duration-200">
                    <AlertCircle size={12} className="text-rose-500" />
                    <span className="text-[10px] font-bold text-rose-500">{errors.weight}</span>
                  </div>
                )}
              </div>
              
              <div className="relative group">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1 tracking-widest">Height (cm)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={profile.height}
                    onChange={(e) => handleChange('height', Number(e.target.value))}
                    className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-slate-900 focus:bg-white transition-all shadow-inner ${errors.height ? 'border-rose-200 focus:border-rose-400' : 'border-transparent focus:border-emerald-100'}`}
                  />
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.height ? 'text-rose-400' : 'text-slate-300'}`}>
                    <Ruler size={20} />
                  </div>
                </div>
                {errors.height && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1 duration-200">
                    <AlertCircle size={12} className="text-rose-500" />
                    <span className="text-[10px] font-bold text-rose-500">{errors.height}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1 tracking-widest">Age (yr)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={profile.age}
                    onChange={(e) => handleChange('age', Number(e.target.value))}
                    className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-slate-900 focus:bg-white transition-all shadow-inner ${errors.age ? 'border-rose-200 focus:border-rose-400' : 'border-transparent focus:border-emerald-100'}`}
                  />
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.age ? 'text-rose-400' : 'text-slate-300'}`}>
                    <Calendar size={20} />
                  </div>
                </div>
                {errors.age && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1 duration-200">
                    <AlertCircle size={12} className="text-rose-500" />
                    <span className="text-[10px] font-bold text-rose-500">{errors.age}</span>
                  </div>
                )}
              </div>
              
              <div className="h-full flex items-end">
                <button 
                  onClick={handleSave}
                  disabled={saveStatus !== 'idle' || isInvalid}
                  className={`w-full py-5 rounded-[2rem] font-black shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 text-sm uppercase tracking-widest ${
                    saveStatus === 'saved' 
                    ? 'bg-[#10B981] text-white shadow-emerald-200' 
                    : isInvalid
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {saveStatus === 'saving' ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : saveStatus === 'saved' ? (
                    <><CheckCircle2 size={20} /> Saved</>
                  ) : isInvalid ? (
                    <><AlertCircle size={20} /> Fix Errors</>
                  ) : (
                    <><Save size={20} /> Update Profile</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50/40 p-8 rounded-[2.5rem] border border-blue-100 flex items-start gap-5">
          <div className="bg-white p-3 rounded-2xl text-blue-500 shadow-sm mt-1 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">On-Device Privacy</h4>
            <p className="text-[11px] text-blue-800 leading-loose font-bold opacity-70">
              Clinical parameters are processed locally to establish real-time scan thresholds. No medical data is persisted beyond your browser's local context.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
