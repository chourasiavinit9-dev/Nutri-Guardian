
import { Camera, AlertTriangle, Info, Speaker, Loader2, Database, ArrowLeftRight, CheckCircle2, XCircle, ShieldCheck, Trophy, Target, Zap, ChevronRight, Activity, HelpCircle, RefreshCw, BookmarkPlus, Check, Sparkles, RefreshCcw, ArrowLeft, ShieldAlert, Star, Upload, Scan, WifiOff, Key, Bookmark, MapPin, Volume2, Beaker, Candy, Shield, FlaskConical, Droplet, Pill, Box, Maximize, AlertCircle, Settings, X, Files, Download, Flame, Search, FlaskConical as LabIcon, RefreshCw as RetryIcon, Image as ImageIcon, Microscope, Thermometer, Biohazard, Bell, Copy, RotateCcw, Layers, Hash, Stethoscope } from 'lucide-react';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UserProfile, AnalysisResult, ComparisonResult, SavedComparison, IngredientInfo, RedFlag, SavedMeal } from '../types';
import { analyzeProduct, compareProducts, auditProductData } from '../geminiService';
import { analyzeProductWithGrok } from '../utils/grokVisionService';
import { fetchProductByBarcode } from '../utils/offApi';

interface ScannerProps {
  profile: UserProfile;
  onConsume: (sodium: number, sugar: number, protein: number, vitamins: number, calories: number, name: string) => void;
  onSaveComparison: (comparison: any) => void;
  onSaveMeal?: (meal: SavedMeal) => void;
}

const CATEGORY_MAP: Record<string, { icon: any, color: string, light: string, dark: string }> = {
  'Core Matrix': { icon: Box, color: 'text-slate-600', light: 'bg-slate-50', dark: 'bg-slate-900' },
  'Refined Sugars': { icon: Candy, color: 'text-amber-600', light: 'bg-amber-50', dark: 'bg-amber-900' },
  'Synthetic Sweeteners': { icon: Sparkles, color: 'text-purple-600', light: 'bg-purple-50', dark: 'bg-purple-900' },
  'Sweeteners': { icon: Candy, color: 'text-amber-600', light: 'bg-amber-50', dark: 'bg-amber-900' },
  'Bio-Preservatives': { icon: Shield, color: 'text-rose-600', light: 'bg-rose-50', dark: 'bg-rose-900' },
  'Preservatives': { icon: Shield, color: 'text-rose-600', light: 'bg-rose-50', dark: 'bg-rose-900' },
  'Industrial Additives': { icon: FlaskConical, color: 'text-blue-600', light: 'bg-blue-50', dark: 'bg-blue-900' },
  'Flavorings': { icon: Sparkles, color: 'text-purple-500', light: 'bg-purple-50', dark: 'bg-purple-900' },
  'Emulsifiers': { icon: Droplet, color: 'text-blue-500', light: 'bg-blue-50', dark: 'bg-blue-900' },
  'Stabilizers': { icon: Layers, color: 'text-indigo-500', light: 'bg-indigo-50', dark: 'bg-indigo-900' },
  'Thickeners': { icon: Maximize, color: 'text-slate-500', light: 'bg-slate-50', dark: 'bg-slate-900' },
  'Essential Nutrients': { icon: Pill, color: 'text-emerald-600', light: 'bg-emerald-50', dark: 'bg-emerald-900' },
  'Clinical Triggers': { icon: Biohazard, color: 'text-red-600', light: 'bg-red-50', dark: 'bg-red-900' },
  'Other': { icon: Beaker, color: 'text-slate-400', light: 'bg-slate-50', dark: 'bg-slate-900' }
};

const StarRating: React.FC<{ rating: number; size?: number; label?: string }> = ({ rating, size = 12, label }) => (
  <div className="flex flex-col items-start gap-1">
    {label && <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</span>}
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className={`p-1 rounded-md ${s <= rating ? 'bg-amber-100 text-amber-500 shadow-sm' : 'bg-slate-100 text-slate-300'}`}>
          <Star size={size} className={s <= rating ? 'fill-amber-500' : ''} />
        </div>
      ))}
    </div>
  </div>
);

const IngredientItem: React.FC<{ ingredient: IngredientInfo; isRedFlag?: boolean; flagReason?: string }> = ({ ingredient, isRedFlag, flagReason }) => {
  const cat = CATEGORY_MAP[isRedFlag ? 'Clinical Triggers' : ingredient.category] || CATEGORY_MAP['Other'];
  const Icon = cat.icon;

  return (
    <div className={`flex gap-4 p-5 rounded-2xl bg-white border transition-all group relative overflow-hidden ${isRedFlag ? 'border-red-200 shadow-lg shadow-red-50' : 'border-slate-100 hover:border-emerald-200'}`}>
      <div className={`p-3.5 rounded-xl h-fit shadow-inner ${cat.light} ${cat.color}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-black text-slate-900 leading-tight">{ingredient.name}</h5>
          {isRedFlag && (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase bg-red-100 text-red-600 px-2 py-1 rounded-md tracking-widest border border-red-200">
              <ShieldAlert size={10} /> Clinical Trigger
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
          {isRedFlag ? flagReason : ingredient.description || 'Verified clinical profile not established.'}
        </p>
      </div>
    </div>
  );
};

const Scanner: React.FC<ScannerProps> = ({ profile, onConsume, onSaveComparison, onSaveMeal }) => {
  const [mode, setMode] = useState<'STANDBY' | 'CAMERA' | 'ANALYZING' | 'RESULT' | 'COMPARISON' | 'ERROR'>('STANDBY');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Initializing Vision Diagnostic...");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isCompareModeEnabled, setIsCompareModeEnabled] = useState(false);
  const [product1, setProduct1] = useState<AnalysisResult | null>(null);
  const [product2, setProduct2] = useState<AnalysisResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [ingredientFilter, setIngredientFilter] = useState('');
  const [error, setError] = useState<{ message: string; type: string; title: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDoctorMode, setIsDoctorMode] = useState(false);
  const lastBarcodeRef = useRef<string | null>(null);
  const barcodeScanTimerRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'CAMERA' && !stream) {
      const startCamera = async () => {
        try {
          const s = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.onloadedmetadata = () => videoRef.current?.play();
          }
        } catch (err: any) {
          setError({ title: "Sensor Access Error", message: "Unable to connect to camera sensor. Check permissions.", type: 'permission' });
          setMode('ERROR');
        }
      };
      startCamera();
    }
    return () => { 
      if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); } 
      if (barcodeScanTimerRef.current) cancelAnimationFrame(barcodeScanTimerRef.current);
    };
  }, [mode]);

  useEffect(() => {
    if (mode === 'CAMERA' && stream && 'BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'] });
      
      const detectBarcode = async () => {
        if (!videoRef.current || mode !== 'CAMERA') return;
        
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code !== lastBarcodeRef.current) {
              lastBarcodeRef.current = code;
              processBarcode(code);
              return; // Stop loop once barcode is sent for processing
            }
          }
        } catch (e) {
          // Barcode detection failed or not supported in current frame
        }
        barcodeScanTimerRef.current = requestAnimationFrame(detectBarcode);
      };
      
      detectBarcode();
    }
  }, [mode, stream]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const b64 = canvas.toDataURL('image/jpeg', 0.85);
        setImage(b64);
        processImage(b64.split(',')[1]);
        if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); }
      }
    }
  };

  const processBarcode = async (barcode: string) => {
    setMode('ANALYZING');
    setStatusText("Decoding Barcode Identity...");
    try {
      const offData = await fetchProductByBarcode(barcode);
      if (offData) {
        setStatusText("Performing Clinical Audit (Structured)...");
        const finalAnalysis = await auditProductData(offData, profile);
        setResult(finalAnalysis);
        setMode('RESULT');
      } else {
        // Fallback to Vision if OFF data is missing
        setToast("Barcode not in registry. Using Vision OCR...");
        setMode('CAMERA'); // Briefly return to camera to trigger frame capture or let user aim
        setTimeout(captureFrame, 500);
      }
    } catch (err: any) {
      handleDiagnosticFailure(err);
    }
  };

  const processImage = async (b64Data: string) => {
    setMode('ANALYZING');
    setStatusText(isCompareModeEnabled ? `Auditing Product ${product1 ? 'B' : 'A'}...` : "Auditing Clinical Safety...");
    try {
      // Use Grok AI for Vision processing, with graceful fallback to Gemini
      let finalAnalysis: AnalysisResult;
      try {
        setStatusText("Auditing via Grok AI Vision Engine...");
        finalAnalysis = await analyzeProductWithGrok(b64Data, profile);
      } catch (grokErr: any) {
        console.warn("Grok AI Vision error or key not configured, falling back to Gemini Vision:", grokErr);
        setStatusText("Auditing via Gemini Vision Engine...");
        finalAnalysis = await analyzeProduct(b64Data, profile);
      }
      if (isCompareModeEnabled) {
        if (!product1) { 
          setProduct1(finalAnalysis); 
          setMode('STANDBY'); 
          setToast("Product A Audited. Scan Product B.");
        }
        else { 
          setProduct2(finalAnalysis); 
          setStatusText("Performing Comparative Neural Audit..."); 
          const comp = await compareProducts(product1, finalAnalysis, profile); 
          setComparison(comp); 
          setMode('COMPARISON'); 
        }
      } else { 
        setResult(finalAnalysis); 
        setMode('RESULT'); 
      }
    } catch (err: any) { 
      handleDiagnosticFailure(err); 
    }
  };

  const handleDiagnosticFailure = (err: any) => {
    console.error("Diagnostic failure:", err);
    setError({ title: "Audit Connection Error", message: "The neural laboratory could not complete the request. Please try again with a clearer image.", type: 'api' });
    setMode('ERROR');
  };

  const reset = () => {
    setImage(null); setResult(null); setError(null); setIsCompareModeEnabled(false);
    setProduct1(null); setProduct2(null); setComparison(null); setIsLogged(false); setIsSaved(false);
    setIngredientFilter(''); setMode('STANDBY'); lastBarcodeRef.current = null;
  };

  const handleLogConsumption = () => {
    if (!result) return;
    onConsume(result.keyNutrients.sodium, result.keyNutrients.sugar, result.keyNutrients.protein, result.keyNutrients.vitamins, result.keyNutrients.calories, result.productName || 'Scan');
    setIsLogged(true);
    setToast("Product logged successfully.");
    setTimeout(reset, 1500);
  };

  const handleSaveToFavorites = () => {
    if (!result || !onSaveMeal) return;
    const meal: SavedMeal = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      name: result.productName || 'Scanned Item',
      clinicalScore: result.clinicalScore,
      calories: result.keyNutrients.calories,
      ingredients: result.ingredientsBreakdown?.map(i => i.name) || [],
      swaps: result.optimizationTips || [],
      clinicalTips: [result.medicalWarning],
      instructions: ["Clinical Audit archived from camera scan."],
      estimatedNutrients: {
        sodium: result.keyNutrients.sodium,
        sugar: result.keyNutrients.sugar,
        protein: result.keyNutrients.protein,
        vitamins: result.keyNutrients.vitamins
      }
    };
    onSaveMeal(meal);
    setIsSaved(true);
    setToast("Audit Saved to Favorites.");
  };

  const handleSaveComparison = () => {
    if (!comparison || !product1 || !product2) return;
    const savedData: SavedComparison = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      product1Name: product1.productName || 'Product A',
      product2Name: product2.productName || 'Product B',
      winner: comparison.betterChoice,
      reasoning: comparison.clinicalReasoning,
      product1Score: comparison.product1Score,
      product2Score: comparison.product2Score
    };
    onSaveComparison(savedData);
    setIsSaved(true);
    setToast("Comparison Lab Archived.");
  };

  const filteredIngredients = useMemo(() => {
    if (!result?.ingredientsBreakdown) return [];
    return result.ingredientsBreakdown.filter(ing => 
      ing.name.toLowerCase().includes(ingredientFilter.toLowerCase()) ||
      ing.category.toLowerCase().includes(ingredientFilter.toLowerCase())
    );
  }, [result?.ingredientsBreakdown, ingredientFilter]);

  const groupedIngredients = useMemo(() => {
    const groups: Record<string, IngredientInfo[]> = {};
    filteredIngredients.forEach(ing => {
      const cat = ing.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ing);
    });
    return groups;
  }, [filteredIngredients]);

  const redFlagNames = useMemo(() => 
    new Set(result?.redFlags.map(f => f.ingredient.toLowerCase()) || []), 
    [result?.redFlags]
  );

  return (
    <div className="max-w-2xl mx-auto pb-32 relative">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3">
            <div className="bg-emerald-500 rounded-full p-1 text-white"><CheckCircle2 size={16} /></div>
            <span className="text-xs font-black uppercase tracking-widest">{toast}</span>
          </div>
        </div>
      )}

      <div className="bento-card bg-white shadow-2xl overflow-hidden border-none flex flex-col min-h-[520px] transition-all duration-500 relative">
        {mode === 'STANDBY' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center mb-10">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 relative group cursor-pointer bg-emerald-50 text-emerald-500" onClick={() => setMode('CAMERA')}>
                {isCompareModeEnabled ? <ArrowLeftRight size={44} /> : <Scan size={44} />}
                <div className="absolute -inset-2 border-2 rounded-[2.5rem] animate-[ping_3s_ease-in-out_infinite] border-emerald-500/20" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Clinical Scan</h2>
              <p className="text-slate-400 font-medium text-sm px-8 max-w-sm">Analyze nutritional labels against your clinical guardrails.</p>
            </div>
            <div className="flex flex-col w-full gap-4 max-w-xs">
              <button onClick={() => setMode('CAMERA')} className="bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-600 transition-all active:scale-95">
                <Camera size={18} /> Initialize Sensor
              </button>
              <button onClick={() => setIsCompareModeEnabled(!isCompareModeEnabled)} className={`border-2 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${isCompareModeEnabled ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-100 text-slate-500'}`}>
                <ArrowLeftRight size={18} /> {isCompareModeEnabled ? 'Comparing Enabled' : 'Comparative Audit'}
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-slate-100 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95">
                <Upload size={18} /> Load Lab Image
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const b64 = ev.target?.result as string;
                    setImage(b64);
                    processImage(b64.split(',')[1]);
                  };
                  reader.readAsDataURL(file);
                }
              }} />
            </div>
          </div>
        )}

        {mode === 'ANALYZING' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 animate-in fade-in duration-300 relative">
            {/* X cancel button */}
            <button
              onClick={reset}
              className="absolute top-4 right-4 p-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-xl transition-all"
              title="Cancel Analysis"
            >
              <X size={18} />
            </button>
            <div className="relative mb-10">
              <div className="w-32 h-32 border-4 border-emerald-500 border-t-transparent rounded-[2.5rem] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-emerald-500"><Database size={40} /></div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{statusText}</h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Accessing Clinical Neural Engine</p>
            <button
              onClick={reset}
              className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 border border-slate-200 rounded-xl px-4 py-2.5 transition-all hover:border-rose-200 bg-white"
            >
              <X size={13} /> Cancel Scan
            </button>
          </div>
        )}

        {mode === 'RESULT' && result && (
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-8 duration-700">
            <div className={`p-10 transition-all duration-700 relative shrink-0 ${isDoctorMode ? 'bg-white text-slate-900 border-b-[6px] border-slate-900' : (result.status === '🔴' ? 'bg-rose-500 text-white' : result.status === '🟡' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white')}`}>
              <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{result.status}</span>
                    <h3 className={`text-4xl font-black tracking-tight ${isDoctorMode ? 'font-serif uppercase underline decoration-4' : ''}`}>{result.productName || 'Audited Subject'}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={handleSaveToFavorites} disabled={isSaved} className={`${isDoctorMode ? 'border-[3px] border-slate-900 text-slate-900 px-6' : 'bg-white/20 text-white hover:bg-white/30 px-4'} py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all`}>
                      {isSaved ? <Check size={14} /> : <BookmarkPlus size={14} />}
                      {isSaved ? 'Archived' : 'Favorite Audit'}
                    </button>
                    <button onClick={() => setIsDoctorMode(!isDoctorMode)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border-[3px] ${isDoctorMode ? 'bg-slate-900 text-white border-slate-900 px-6' : 'bg-white/20 text-white border-transparent hover:bg-white/30'}`}>
                      <Stethoscope size={14} /> {isDoctorMode ? 'Exit Doctor Mode' : 'Doctor Mode'}
                    </button>
                  </div>
                  <div className="flex gap-6 pt-2">
                    <StarRating rating={result.clinicalScore} size={14} label="Condition Adherence" />
                    <StarRating rating={result.calorieScore} size={14} label="Calorie Density" />
                  </div>
                </div>
                <button onClick={reset} className={`p-4 rounded-2xl transition-all ${isDoctorMode ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-white/20 text-white hover:bg-white/30'}`}><X size={24} /></button>
              </div>
            </div>

            <div className={`p-8 space-y-12 transition-colors duration-500 ${isDoctorMode ? 'bg-white grayscale contrast-125 font-mono' : 'bg-white'}`}>
              <section className={`p-8 rounded-[2rem] border ${isDoctorMode ? 'bg-white border-[3px] border-slate-900' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <Activity size={20} className={isDoctorMode ? 'text-slate-900' : 'text-emerald-500'} />
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400">Clinical Narrative</h4>
                </div>
                <p className={`text-sm font-bold leading-loose italic ${isDoctorMode ? 'text-slate-900' : 'text-slate-700'}`}>"{result.medicalWarning}"</p>
              </section>

              {result.optimizationTips && result.optimizationTips.length > 0 && (
                <section className={`p-8 rounded-[2.5rem] border ${isDoctorMode ? 'bg-white border-[3px] border-slate-900' : 'bg-emerald-50/50 border-emerald-100'}`}>
                   <div className="flex items-center gap-3 mb-6">
                     <Zap size={20} className={isDoctorMode ? 'text-slate-900' : 'text-emerald-500'} />
                     <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400">Clinical Optimization Lab</h4>
                   </div>
                   <div className="space-y-4">
                      {((result.optimizationTips as any) || []).map((tip: string, i: number) => (
                        <div key={i} className="flex gap-4 items-start group">
                           <div className={`mt-1 p-1 bg-white border rounded-lg ${isDoctorMode ? 'border-slate-900 text-slate-900' : 'border-emerald-200 text-emerald-500 shadow-sm'}`}><CheckCircle2 size={12} /></div>
                           <p className={`text-[11px] font-bold leading-relaxed ${isDoctorMode ? 'text-slate-900 uppercase underline' : 'text-emerald-800'}`}>{tip}</p>
                        </div>
                      ))}
                   </div>
                </section>
              )}

              <section className="space-y-8">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <Microscope size={20} className="text-emerald-500" />
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400">Ingredient Audit Laboratory</h4>
                  </div>
                </div>
                <div className="space-y-10">
                  {Object.entries(groupedIngredients).map(([category, ings]) => {
                    const catInfo = CATEGORY_MAP[category] || CATEGORY_MAP['Other'];
                    const CatIcon = catInfo.icon;
                    return (
                      <div key={category} className="space-y-4">
                        <div className="flex items-center gap-3 px-1 border-b border-slate-100 pb-2">
                          <div className={`p-1.5 rounded-lg ${catInfo.light} ${catInfo.color}`}><CatIcon size={14} /></div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900">{category}</h5>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {(ings as any[]).map((ing, idx) => {
                            const isFlag = redFlagNames.has(ing.name.toLowerCase());
                            const flagReason = result.redFlags.find(f => f.ingredient.toLowerCase() === ing.name.toLowerCase())?.reason;
                            return <IngredientItem key={idx} ingredient={ing} isRedFlag={isFlag} flagReason={flagReason} />;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button onClick={handleLogConsumption} disabled={isLogged} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95">
                  {isLogged ? <CheckCircle2 /> : <><BookmarkPlus /> Log to Health Budget</>}
                </button>
                <button onClick={reset} className="px-8 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-100 transition-all">New Scan</button>
              </div>
            </div>
          </div>
        )}

        {mode === 'CAMERA' && (
          <div className="flex-1 relative flex flex-col bg-black">
            <video ref={videoRef} playsInline autoFocus className="flex-1 object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <button onClick={() => setMode('STANDBY')} className="absolute top-6 left-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 transition-all z-40"><ArrowLeft size={24} /></button>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 border-2 rounded-[3rem] relative animate-pulse border-emerald-500/20">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 rounded-tl-2xl border-emerald-500" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 rounded-tr-2xl border-emerald-500" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 rounded-bl-2xl border-emerald-500" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 rounded-br-2xl border-emerald-500" />
              </div>
            </div>
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-30">
               <button onClick={captureFrame} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all ring-8 ring-white/10"><div className="w-16 h-16 border-4 border-slate-900 rounded-full" /></button>
            </div>
          </div>
        )}

        {mode === 'ERROR' && error && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-300">
             <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6"><AlertCircle size={40} /></div>
             <h3 className="text-2xl font-black text-slate-900 mb-2">{error.title}</h3>
             <p className="text-sm text-slate-400 font-medium mb-10 max-w-xs leading-relaxed">{error.message}</p>
             <button onClick={reset} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95">Retry Clinical Scan</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
