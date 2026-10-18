import { EatingLog, MealSuggestion, ChronicDisease } from '../types';

/**
 * SEARCH ENGINE
 * Case-insensitive partial matching across multiple clinical datasets.
 */
export const searchLocalData = (query: string, data: { logs: EatingLog[], fridge: string[], meals: any[] }) => {
  const q = query.toLowerCase().trim();
  if (!q) return { logs: [], fridge: [], meals: [] };

  return {
    logs: data.logs.filter(l => l.name.toLowerCase().includes(q)),
    fridge: data.fridge.filter(i => i.toLowerCase().includes(q)),
    meals: data.meals.filter(m => m.name.toLowerCase().includes(q))
  };
};

/**
 * STREAK SYSTEM
 * Calculates logging consistency and adherence to clinical limits.
 */
export const calculateStreaks = (logs: EatingLog[]) => {
  if (logs.length === 0) return { logging: 0, compliance: 0 };

  const sorted = [...logs].sort((a, b) => b.timestamp - a.timestamp);
  let loggingStreak = 0;
  let complianceStreak = 0;
  
  const today = new Date().toDateString();
  let checkDate = new Date();

  // Logging Streak Calculation
  for (let i = 0; i < 30; i++) {
    const dStr = checkDate.toDateString();
    const hasLog = sorted.some(l => new Date(l.timestamp).toDateString() === dStr);
    if (hasLog) {
      loggingStreak++;
      // Check compliance (hypothetical limit check)
      const dailyLogs = sorted.filter(l => new Date(l.timestamp).toDateString() === dStr);
      const dailySodium = dailyLogs.reduce((sum, l) => sum + l.sodium, 0);
      if (dailySodium < 2300) complianceStreak++;
    } else if (i > 0) {
      break; 
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return { logging: loggingStreak, compliance: complianceStreak };
};

/**
 * SMART SWAP ENGINE
 * Clinical alternatives for chronic disease management.
 */
export const INGREDIENT_SWAPS: Record<string, { alt: string, reason: string, impact: string, caution?: string }> = {
  'white rice': { alt: 'Cauliflower Rice', reason: 'Lower glycemic index', impact: 'Reduces blood sugar spike by 60%', caution: 'Flavor profile is milder' },
  'soy sauce': { alt: 'Coconut Aminos', reason: 'Significantly lower sodium', impact: 'Protects kidney filtration', caution: 'Slightly sweeter' },
  'table salt': { alt: 'Potassium Salt / Herbs', reason: 'Reduces sodium intake', impact: 'Lowers systolic BP', caution: 'Not for advanced CKD' },
  'mayonnaise': { alt: 'Greek Yogurt', reason: 'Higher protein, lower fat', impact: 'Heart healthy alternative', caution: 'Tangier taste' },
  'pasta': { alt: 'Zucchini Noodles (Zoodles)', reason: 'Low carb, high fiber', impact: 'Diabetes friendly', caution: 'High water content' },
  'sugar': { alt: 'Stevia / Erythritol', reason: 'Zero calorie sweetener', impact: 'Prevents insulin spikes', caution: 'Aftertaste varies' },
  'butter': { alt: 'Avocado Oil', reason: 'Monounsaturated fats', impact: 'Improves cholesterol profile', caution: 'Liquid at room temp' },
  'whole milk': { alt: 'Unsweetened Almond Milk', reason: 'Lower sugar and calories', impact: 'Weight management support', caution: 'Lower protein content' }
};

export const getIngredientSwaps = (ingredients: string[]) => {
  return ingredients
    .map(ing => {
      const found = Object.entries(INGREDIENT_SWAPS).find(([key]) => ing.toLowerCase().includes(key));
      return found ? { original: ing, ...found[1] } : null;
    })
    .filter((res): res is { original: string, alt: string, reason: string, impact: string, caution?: string } => res !== null);
};

/**
 * ANALYTICS ENGINE
 * Aggregates 7-day health trends for dashboard charts.
 */
export const getWeeklyTrends = (logs: EatingLog[]) => {
  const trends = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toDateString();
    const dayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === dStr);
    trends.push({
      date: dStr,
      dayShort: d.toLocaleDateString(undefined, { weekday: 'short' }),
      sugar: dayLogs.reduce((sum, l) => sum + l.sugar, 0),
      sodium: dayLogs.reduce((sum, l) => sum + l.sodium, 0),
      protein: dayLogs.reduce((sum, l) => sum + l.protein, 0),
      calories: dayLogs.reduce((sum, l) => sum + (l.calories || 0), 0)
    });
  }
  return trends;
};

export const getWeeklyAnalytics = (logs: EatingLog[]) => {
  const trends = getWeeklyTrends(logs);
  const total = trends.length;

  return {
    trends,
    avgCalories: total ? Math.round(trends.reduce((sum, t) => sum + t.calories, 0) / total) : 0,
    avgSodium: total ? Math.round(trends.reduce((sum, t) => sum + t.sodium, 0) / total) : 0,
    avgSugar: total ? Math.round(trends.reduce((sum, t) => sum + t.sugar, 0) / total) : 0,
    avgProtein: total ? Math.round(trends.reduce((sum, t) => sum + t.protein, 0) / total) : 0,
    totalLogs: logs.length
  };
};

/**
 * OFFLINE MEAL SUGGESTER
 * Rule-based fallback if AI fails.
 */
export const offlineMealSuggester = (fridge: string[], disease: ChronicDisease): MealSuggestion => {
  const templates = [
    { name: 'Pantry Protein Bowl', sodium: 350, sugar: 2, cal: 450 },
    { name: 'Clinical Stir-Fry', sodium: 420, sugar: 4, cal: 380 },
    { name: 'Metabolic Support Salad', sodium: 210, sugar: 1, cal: 310 }
  ];
  
  const base = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    name: `Offline: ${base.name}`,
    clinicalScore: 4,
    calories: base.cal,
    ingredients: fridge.slice(0, 3),
    swaps: ['Use herbs instead of salt'],
    clinicalTips: ['Rinse ingredients to lower sodium'],
    instructions: ['Combine ingredients in a pan', 'Cook over medium heat', 'Serve immediately'],
    estimatedNutrients: {
      sodium: base.sodium,
      sugar: base.sugar,
      protein: 25,
      vitamins: 80
    }
  };
};