
import React, { useState, useMemo } from 'react';
import { Apple, Plus, X, Search, ChevronRight, Loader2, Sparkles, Utensils, ChefHat, Heart, Trash2, ShoppingBasket, Soup, Flame, Star, ListOrdered, Info, ArrowLeftRight, Activity, BookmarkPlus, CheckCircle2, Zap, ArrowRight, ShieldCheck, Thermometer, Droplet, Clock } from 'lucide-react';
import { UserProfile, MealSuggestion, SavedMeal } from '../types';
import { suggestMeal } from '../geminiService';
import { getIngredientSwaps } from '../utils/logicEngine';

interface FridgeProps {
  profile: UserProfile;
  fridge: string[];
  setFridge: (f: string[]) => void;
  onLogMeal?: (sodium: number, sugar: number, protein: number, vitamins: number, calories: number, name: string) => void;
  savedMeals?: SavedMeal[];
  onSaveMeal?: (meal: SavedMeal) => void;
  onRemoveMeal?: (id: string) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <div key={s} className={`p-1 rounded-md ${s <= rating ? 'bg-amber-100 text-amber-500 shadow-sm' : 'bg-slate-100 text-slate-300'}`}>
        <Star size={12} className={s <= rating ? 'fill-amber-500' : ''} />
      </div>
    ))}
  </div>
);

const FridgeManager: React.FC<FridgeProps> = ({ profile, fridge, setFridge, onLogMeal, savedMeals = [], onSaveMeal, onRemoveMeal }) => {
  const [newItem, setNewItem] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [meal, setMeal] = useState<MealSuggestion | null>(null);
  const [isLogged, setIsLogged] = useState(false);

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      setFridge([...fridge, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => setFridge(fridge.filter((_, i) => i !== index));

  const generateAILunch = async (focusItem?: string) => {
    setIsGenerating(true); 
    setMeal(null); 
    setIsLogged(false);
    
    const itemsToAnalyze = focusItem ? [focusItem, ...fridge.filter(i => i !== focusItem)] : fridge;
    
    try {
      const result = await suggestMeal(itemsToAnalyze, profile);
      if (result && result.mealSuggestion) {
        setMeal(result.mealSuggestion);
      }
    } catch (err) { 
      console.error("Meal generation failed:", err); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleLogMeal = () => {
    if (!meal || !onLogMeal) return;
    const { sodium = 0, sugar = 0, protein = 0, vitamins = 0 } = meal.estimatedNutrients || {};
    onLogMeal(sodium, sugar, protein, vitamins, meal.calories || 0, meal.name || 'Pantry Meal');
    setIsLogged(true);
    setTimeout(() => {
      setMeal(null);
      setIsLogged(false);
    }, 1500);
  };

  // Maps all ingredients to their clinical swaps where available
  const ingredientDetailedList = useMemo(() => {
    if (!meal) return [];
    return meal.ingredients.map(ing => {
      const localSwap = getIngredientSwaps([ing])[0];
      // Also look for swaps returned by AI in the meal.swaps array
      const aiSwap = meal.swaps.find(s => s.toLowerCase().includes(ing.toLowerCase()));
      // Added 'reason' to the manual object to satisfy the common properties check in the union
      return {
        name: ing,
        swap: localSwap || (aiSwap ? { 
          alt: aiSwap.split(':')[1]?.trim() || aiSwap, 
          impact: 'Condition optimization',
          reason: 'Condition optimization'
        } : null)
      };
    });
  }, [meal]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bento-card p-10 bg-white shadow-xl border-none relative overflow-hidden">
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-4">
               <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner">
                 <ShoppingBasket size={28} />
               </div>
               <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Pantry</h2>
                 <p className="text-slate-400 font-medium text-sm mt-0.5">Inventorying ingredients for audit</p>
               </div>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">{fridge.length} Items</div>
          </div>
          
          <form onSubmit={addItem} className="flex gap-3 mb-10 relative">
            <input 
              type="text" 
              placeholder="E.g. Baby Spinach, Wild Salmon..."
              className="flex-1 bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4.5 text-sm font-bold focus:bg-white focus:border-emerald-200 focus:ring-4 transition-all placeholder:text-slate-300 shadow-inner"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
            />
            <button type="submit" className="bg-emerald-500 text-white w-14 h-14 rounded-2xl shadow-lg hover:bg-emerald-600 transition-all active:scale-90 flex items-center justify-center">
              <Plus size={28} />
            </button>
          </form>

          <div className="flex flex-wrap gap-3">
            {fridge.map((item, idx) => (
              <div key={idx} className="bg-slate-50/80 border border-slate-200 py-3 pl-5 pr-3 rounded-xl text-xs font-black text-slate-700 flex items-center gap-3 group hover:border-emerald-500 transition-all shadow-sm">
                <span>{item}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => generateAILunch(item)} 
                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Generate recipe with this"
                  >
                    <ChefHat size={14} />
                  </button>
                  <button onClick={() => removeItem(idx)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest px-2 flex items-center gap-2">
            <Heart size={16} className="text-rose-500" /> Saved Protocols
          </h3>
          <div className="flex flex-col gap-4">
            {savedMeals && savedMeals.length > 0 ? savedMeals.map((saved) => (
              <div key={saved.id} className="bento-card p-5 bg-white flex items-center justify-between">
                 <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500"><Soup size={20} /></div>
                    <div className="max-w-[120px]">
                      <h5 className="font-extrabold text-slate-800 text-xs truncate">{saved.name}</h5>
                      <StarRating rating={saved.clinicalScore} />
                    </div>
                 </div>
                 <button onClick={() => onRemoveMeal?.(saved.id)} className="p-2.5 text-slate-200 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={16} /></button>
              </div>
            )) : (
              <div className="bento-card p-10 bg-white/50 border-dashed text-center text-slate-300 font-bold text-[10px] uppercase">No saved recipes</div>
            )}
          </div>
        </div>
      </div>

      <button 
        onClick={() => generateAILunch()} 
        disabled={fridge.length < 2 || isGenerating} 
        className="w-full bg-slate-900 text-white py-7 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300"
      >
        {isGenerating ? <Loader2 className="animate-spin" size={26} /> : <Sparkles size={26} />}
        <span className="uppercase tracking-[0.2em] text-sm">Launch Neural Recipe Lab</span>
      </button>

      {meal && (
        <div className="animate-in zoom-in duration-500 space-y-8 pb-20">
          <div className="bento-card overflow-hidden border-none shadow-2xl bg-white">
            <div className="bg-slate-900 p-12 text-white relative">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                   <div className="bg-emerald-500/20 text-[10px] font-black uppercase px-4 py-2 rounded-xl backdrop-blur-md border border-emerald-500/20 text-emerald-400">Clinical Protocol: {profile.chronicDisease}</div>
                   <button onClick={() => setMeal(null)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                      <X size={20} />
                   </button>
                </div>
                <h3 className="text-4xl font-black mb-6 tracking-tight text-white">{meal.name}</h3>
                <div className="flex flex-wrap items-center gap-8">
                   <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Adherence Status</span>
                      <StarRating rating={meal.clinicalScore} />
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <Flame size={16} className="text-amber-500" />
                        <span className="text-sm font-black uppercase tracking-widest text-slate-200">{meal.calories} kcal</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <Clock size={16} className="text-blue-400" />
                        <span className="text-sm font-black uppercase tracking-widest text-slate-200">~15 MIN PREP</span>
                      </div>
                   </div>
                </div>
              </div>
              <Sparkles className="absolute -right-16 -bottom-16 text-emerald-500/10" size={240} />
            </div>

            <div className="p-8 md:p-12 space-y-16">
              <section className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner">
                <div className="flex items-center gap-3 mb-8">
                  <Activity size={20} className="text-emerald-500" />
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Nutritional Logic</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                   {meal.estimatedNutrients && (Object.entries(meal.estimatedNutrients) as [string, number][]).map(([key, val]) => (
                     <div key={key} className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm transition-transform hover:scale-105">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{key}</p>
                        <p className={`text-2xl font-black leading-none ${key === 'sodium' && val > 500 ? 'text-amber-500' : 'text-slate-900'}`}>
                          {val}<span className="text-[10px] ml-1 text-slate-400 font-bold lowercase">{key === 'sodium' ? 'mg' : 'g'}</span>
                        </p>
                     </div>
                   ))}
                </div>
              </section>

              <div className="space-y-10">
                <div className="flex items-center gap-3">
                  <ChefHat size={20} className="text-emerald-500" />
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Ingredient Lab & Swaps</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ingredientDetailedList.map((item, i) => (
                    <div key={i} className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between ${item.swap ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-xl ${item.swap ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400'}`}><Apple size={16} /></div>
                           <span className="text-sm font-black text-slate-800">{item.name}</span>
                        </div>
                        {item.swap && <span className="text-[8px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">Clinical Alternative Available</span>}
                      </div>
                      {item.swap ? (
                        <div className="bg-white p-4 rounded-2xl border border-blue-200/50 shadow-sm animate-in fade-in slide-in-from-left-2">
                           <div className="flex items-center gap-2 mb-1">
                              <ArrowRight size={12} className="text-emerald-500" />
                              <span className="text-[11px] font-black text-emerald-700">Swap with: {item.swap.alt}</span>
                           </div>
                           <p className="text-[10px] text-slate-500 font-bold italic leading-relaxed">{item.swap.impact || item.swap.reason}</p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold px-1 italic">Audit: Safe for condition as is.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-10">
                <div className="flex items-center gap-3">
                  <ListOrdered size={20} className="text-emerald-500" />
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Culinary Protocol</h4>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {meal.instructions.map((step, i) => (
                    <div key={i} className="flex gap-8 group">
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 text-white text-sm font-black flex items-center justify-center shadow-xl group-hover:bg-emerald-500 transition-colors">
                          {i + 1}
                        </div>
                        {i < meal.instructions.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-4 group-hover:bg-emerald-100 transition-colors" />}
                      </div>
                      <div className="flex-1 pb-10">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 group-hover:border-emerald-200 group-hover:shadow-lg transition-all">
                           <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">{step}</p>
                           <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                <Thermometer size={12} /> Prep Scan
                              </div>
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                                <ShieldCheck size={12} /> Clinical Safe
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {meal.clinicalTips.length > 0 && (
                <section className="p-10 bg-amber-50/50 border border-amber-100 rounded-[2.5rem]">
                   <div className="flex items-center gap-3 mb-8">
                     <Zap size={20} className="text-amber-500" />
                     <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-amber-700">Clinical Hacks (Prep Mode)</h4>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {meal.clinicalTips.map((tip, i) => (
                        <div key={i} className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-amber-200/50 shadow-sm">
                           <div className="mt-1 p-1 bg-amber-100 rounded-lg text-amber-600"><Droplet size={14} /></div>
                           <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                   </div>
                </section>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100">
                <button 
                  onClick={handleLogMeal} 
                  disabled={isLogged} 
                  className="flex-[2] bg-slate-900 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  {isLogged ? <><CheckCircle2 size={24} /> Audit Logged</> : <><BookmarkPlus size={24} /> Commit to Daily Health Budget</>}
                </button>
                <button 
                  onClick={() => setMeal(null)} 
                  className="flex-1 bg-white border border-slate-200 text-slate-400 py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Discard Lab Results
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FridgeManager;
