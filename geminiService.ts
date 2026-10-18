
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile, AnalysisResult, ChronicDisease, ComparisonResult, SymptomAnalysis, MealSuggestion, MealSuggestionResponse } from "./types";
import { offlineMealSuggester } from "./utils/logicEngine";

const getDiseaseContext = (userProfile: UserProfile) => {
  if (userProfile.chronicDisease === ChronicDisease.CUSTOM) {
    return `Condition: ${userProfile.customDiseaseName || 'Custom Condition'}. 
            Mandatory Dietary Restrictions: ${userProfile.customRestrictions || 'User-defined healthy limits'}.`;
  }
  return `Condition: ${userProfile.chronicDisease}.`;
};

const SYSTEM_INSTRUCTION = `You are Nutri-Guardian Pro, a clinical nutritional assistant for chronic disease management.
You perform a "Deep Clinical Audit" of food labels and products.

CORE SCAN PROTOCOLS:
1. NUTRIENT EXTRACTION: Calories, Sodium (mg), Sugar (g), Protein (g), Vitamins (as % Daily Value).
2. SAFETY CHECK (RED FLAGS): Scan ingredients for specific medical triggers.
3. INGREDIENT LABORATORY: Categorize EACH ingredient into standardized classes: 'Sweeteners', 'Preservatives', 'Flavorings', 'Emulsifiers', 'Stabilizers', 'Thickeners', 'Essential Nutrients', or 'Core Matrix'.
4. CLINICAL OPTIMIZATION: Provide specific preparation or usage hacks to lower nutrient risks.
5. CLINICAL SCORING: Assign 'clinicalScore' (1-5) based on disease adherence.

RESPONSE FORMAT: ALWAYS return valid JSON within a code block.`;

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING },
    productName: { type: Type.STRING },
    clinicalScore: { type: Type.INTEGER },
    calorieScore: { type: Type.INTEGER },
    keyNutrients: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        sodium: { type: Type.NUMBER },
        sugar: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        vitamins: { type: Type.NUMBER },
        potassium: { type: Type.NUMBER },
        phosphorus: { type: Type.NUMBER }
      }
    },
    redFlags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          ingredient: { type: Type.STRING },
          reason: { type: Type.STRING },
          severity: { type: Type.STRING }
        },
        required: ['ingredient', 'reason', 'severity']
      }
    },
    ingredientsBreakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ['name', 'category']
      }
    },
    optimizationTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    medicalWarning: { type: Type.STRING },
    dailyImpact: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.STRING },
        sodium: { type: Type.STRING },
        sugar: { type: Type.STRING },
        protein: { type: Type.STRING },
        vitamins: { type: Type.STRING }
      }
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        verdict: { type: Type.STRING }
      }
    },
    compliance: {
      type: Type.OBJECT,
      properties: {
        whoSaltTarget: { type: Type.STRING },
        nutriScore: { type: Type.STRING }
      }
    },
    voiceResponse: { type: Type.STRING }
  },
  required: ['status', 'clinicalScore', 'calorieScore', 'keyNutrients', 'redFlags', 'medicalWarning', 'dailyImpact', 'recommendation', 'compliance', 'voiceResponse', 'ingredientsBreakdown', 'optimizationTips']
};

const MEAL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mealSuggestion: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        clinicalScore: { type: Type.INTEGER },
        calories: { type: Type.NUMBER },
        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        swaps: { type: Type.ARRAY, items: { type: Type.STRING } },
        clinicalTips: { type: Type.ARRAY, items: { type: Type.STRING } },
        instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
        estimatedNutrients: {
          type: Type.OBJECT,
          properties: {
            sodium: { type: Type.NUMBER },
            sugar: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            vitamins: { type: Type.NUMBER }
          }
        }
      },
      required: ['name', 'clinicalScore', 'calories', 'ingredients', 'swaps', 'clinicalTips', 'instructions', 'estimatedNutrients']
    }
  }
};

const SYMPTOM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    possibleCondition: { type: Type.STRING },
    confidence: { type: Type.STRING },
    explanation: { type: Type.STRING },
    suggestedMedication: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          action: { type: Type.STRING },
          notes: { type: Type.STRING }
        },
        required: ['name', 'type', 'notes']
      }
    },
    lifestyleAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
    avoidanceProtocol: { type: Type.ARRAY, items: { type: Type.STRING } },
    nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
    urgency: { type: Type.STRING },
    disclaimer: { type: Type.STRING }
  },
  required: ['possibleCondition', 'confidence', 'explanation', 'suggestedMedication', 'lifestyleAdvice', 'avoidanceProtocol', 'nextSteps', 'urgency', 'disclaimer']
};

const parseJSON = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    console.error("Failed to parse JSON from AI response:", text);
    throw new Error("Invalid response format from Clinical Lab.");
  }
};

// Resilient model fallback cascade to handle free-tier quotas and 429 rate limits
const FALLBACK_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash'
];

async function callGeminiWithFallback(ai: GoogleGenAI, requestConfig: any) {
  let lastError: any = null;
  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...requestConfig,
        model
      });
      return response;
    } catch (err: any) {
      console.warn(`[Nutri-Guardian Lab] Model ${model} failed (${err?.status || err?.message}). Trying fallback...`);
      lastError = err;
      // If error is not a rate-limit/quota or model-not-found error, retry with next model anyway
    }
  }
  throw lastError;
}

export const searchAndAnalyzeProduct = async (query: string, userProfile: UserProfile): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const diseaseContext = getDiseaseContext(userProfile);
  const response = await callGeminiWithFallback(ai, {
    contents: `Clinical Search Audit for "${query}". 
    Patient Profile: ${userProfile.age}yr, ${userProfile.weight}kg. 
    ${diseaseContext}. 
    Analyze the nutritional suitability and extraction detailed nutrient data.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });

  const baseResult = JSON.parse(response.text || '{}') as AnalysisResult;
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => ({
      title: chunk.web?.title || 'Clinical Source',
      url: chunk.web?.uri || '#'
    }))
    .filter((s: any) => s.url && s.url !== '#') || [];

  return { ...baseResult, sources };
};

export const analyzeProduct = async (imageB64: string, userProfile: UserProfile): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const diseaseContext = getDiseaseContext(userProfile);
  const response = await callGeminiWithFallback(ai, {
    contents: {
      parts: [
        { inlineData: { data: imageB64, mimeType: 'image/jpeg' } },
        { text: `Clinical Audit for ${diseaseContext}. Analyze label.` }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return JSON.parse(response.text || '{}');
};

export const auditProductData = async (productData: any, userProfile: UserProfile): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || process.env.API_KEY });
  const diseaseContext = getDiseaseContext(userProfile);
  const response = await callGeminiWithFallback(ai, {
    contents: `Perform a Deep Clinical Audit on this structured product data for a patient with ${diseaseContext}.
    
    PRODUCT DATA:
    ${JSON.stringify(productData, null, 2)}
    
    Analyze the nutritional suitability and extraction detailed nutrient data based on the provided JSON.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return JSON.parse(response.text || '{}');
};

export const compareProducts = async (p1: AnalysisResult, p2: AnalysisResult, userProfile: UserProfile): Promise<ComparisonResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const diseaseContext = getDiseaseContext(userProfile);
  const response = await callGeminiWithFallback(ai, {
    contents: `Compare for ${diseaseContext}: Product A: ${p1.productName} (Score: ${p1.clinicalScore}) vs Product B: ${p2.productName} (Score: ${p2.clinicalScore}).`,
    config: {
      systemInstruction: "You are a clinical nutritionist. Compare products and return valid JSON.",
      responseMimeType: "application/json"
    }
  });
  return parseJSON(response.text || '');
};

// Offline heuristic diagnostic generator in case all cloud API models are unavailable
const generateOfflineTriage = (symptoms: string, profile: UserProfile): SymptomAnalysis => {
  const disease = profile.chronicDisease;
  const isEmergency = /chest pain|difficulty breathing|faint|unconscious|severe shortness of breath|blood/i.test(symptoms);
  
  return {
    triageLevel: isEmergency ? 'Emergency' : 'Moderate',
    conditionEstimate: `Clinical evaluation for symptoms related to ${disease}: "${symptoms.slice(0, 80)}"`,
    clinicalReasoning: `Symptoms evaluated under ${disease} clinical guardrails. For chronic metabolic and cardiovascular conditions, reports of ${symptoms.slice(0, 50)} require careful electrolyte and hemodynamic monitoring.`,
    suggestedMedications: [
      {
        name: 'Oral Rehydration Salts (ORS) / Electrolyte solution',
        type: 'Electrolyte Balance',
        purpose: 'Stabilize cellular fluid distribution and hydration levels',
        safetyNote: `Verify sodium & potassium restrictions aligned with ${disease} management.`
      },
      {
        name: 'Acetaminophen (Paracetamol)',
        type: 'Analgesic / Antipyretic',
        purpose: 'Symptomatic pain or discomfort relief if needed',
        safetyNote: 'Avoid NSAIDs (Ibuprofen, Naproxen) in renal or severe hypertension cases.'
      }
    ],
    avoidanceProtocol: [
      'Avoid high-sodium processed foods and high-sugar sports drinks',
      'Avoid unprescribed NSAIDs and excessive caffeine',
      'Avoid sudden intense physical exertion until cleared by your physician'
    ],
    nextSteps: [
      'Log vital signs (blood pressure, blood glucose, heart rate) immediately in the portal',
      'Hydrate with moderate sips of clean water',
      'Consult your attending primary physician or specialist if symptoms persist past 2 hours'
    ],
    redFlags: [
      'Chest pain radiating to arm, neck, or jaw',
      'Shortness of breath at rest or acute facial swelling',
      'Sudden loss of balance, confusion, or speech changes'
    ]
  };
};

export const analyzeSymptoms = async (symptoms: string, profile: UserProfile): Promise<SymptomAnalysis> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const diseaseContext = getDiseaseContext(profile);
    const response = await callGeminiWithFallback(ai, {
      contents: `Patient with ${diseaseContext} reports: "${symptoms}". Perform deep triage.`,
      config: {
        systemInstruction: `You are a clinical diagnostic scribe using verified open-source data (Mayo Clinic, WebMD).
        
        OUTPUT REQUIREMENTS:
        1. CLINICAL REASONING: Detailed explanation of medical logic.
        2. MEDICATION SUGGESTIONS: Suggest common, verified medications (e.g., Paracetamol) ONLY if safe for ${profile.chronicDisease}.
        3. AVOIDANCE PROTOCOL: Explicitly list what to avoid (foods, specific meds, or activities).
        4. NEXT STEPS: Actionable steps for the patient.
        5. RED FLAGS: List critical clinical warning signs requiring ER visit.
        
        MANDATORY: Return valid JSON matching the provided schema. Do not nest results under a 'triage_report' key.`,
        responseMimeType: "application/json",
        responseSchema: SYMPTOM_SCHEMA
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.warn("Cloud diagnostic API unavailable, falling back to local clinical knowledge engine.", err);
    return generateOfflineTriage(symptoms, profile);
  }
};

export const suggestMeal = async (fridge: string[], userProfile: UserProfile): Promise<MealSuggestionResponse> => {
  if (!process.env.API_KEY) {
     return { mealSuggestion: offlineMealSuggester(fridge, userProfile.chronicDisease) };
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const diseaseContext = getDiseaseContext(userProfile);
    const response = await callGeminiWithFallback(ai, {
      contents: `Suggest a highly detailed clinical recipe for ${diseaseContext} using items from: ${fridge.join(', ')}.
      REQUIREMENTS:
      1. INSTRUCTIONS: Provide 5+ detailed culinary steps.
      2. SWAPS: For every major ingredient, provide a clinical substitution in the format "Ingredient: Swap (Reason)".
      3. CLINICAL TIPS: Include prep hacks to reduce sodium/sugar.`,
      config: {
        systemInstruction: "You are a senior clinical dietitian and Michelin-star chef. Provide extremely detailed instructions and ingredient-specific clinical swaps. Return a JSON object with a 'mealSuggestion' property.",
        responseMimeType: "application/json",
        responseSchema: MEAL_SCHEMA
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.warn("AI meal suggestion failed, using offline logic.");
    return { mealSuggestion: offlineMealSuggester(fridge, userProfile.chronicDisease) };
  }
};

export function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export const refineClinicalRestrictions = async (restrictions: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await callGeminiWithFallback(ai, {
      contents: `Refine the following clinical dietary restrictions for better AI auditing: "${restrictions}".`,
    });
    return response.text || restrictions;
  } catch (err) {
    return restrictions;
  }
};
