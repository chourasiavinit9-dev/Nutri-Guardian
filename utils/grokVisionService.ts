import { UserProfile, AnalysisResult, ChronicDisease } from '../types';

const getDiseaseContext = (userProfile: UserProfile) => {
  if (userProfile.chronicDisease === ChronicDisease.CUSTOM) {
    return `Condition: ${userProfile.customDiseaseName || 'Custom Condition'}. 
            Mandatory Dietary Restrictions: ${userProfile.customRestrictions || 'User-defined healthy limits'}.`;
  }
  return `Condition: ${userProfile.chronicDisease}.`;
};

const SYSTEM_INSTRUCTION = `You are Nutri-Guardian Pro, an expert clinical nutritional AI auditor for chronic disease management.
You perform a Deep Clinical Audit of food labels and nutrition facts panels.

CORE SCAN PROTOCOLS:
1. NUTRIENT EXTRACTION: Calories, Sodium (mg), Sugar (g), Protein (g), Vitamins (as % Daily Value), Potassium (mg), Phosphorus (mg).
2. SAFETY CHECK (RED FLAGS): Scan ingredients for specific medical triggers for the patient's condition.
3. INGREDIENT LABORATORY: Categorize EACH ingredient into standardized classes: 'Sweeteners', 'Preservatives', 'Flavorings', 'Emulsifiers', 'Stabilizers', 'Thickeners', 'Essential Nutrients', or 'Core Matrix'.
4. CLINICAL OPTIMIZATION: Provide specific preparation or usage hacks to lower nutrient risks.
5. CLINICAL SCORING: Assign 'clinicalScore' (1-5) based on disease adherence.

RESPONSE FORMAT: You MUST return ONLY a valid JSON object (no markdown surrounding ticks, or raw markdown json block) matching this exact schema:
{
  "status": "APPROVED" | "WARNING" | "CRITICAL",
  "productName": "Identified Food / Beverage Name",
  "clinicalScore": 1 to 5 integer,
  "calorieScore": 1 to 5 integer,
  "keyNutrients": {
    "calories": number,
    "sodium": number (in mg),
    "sugar": number (in g),
    "protein": number (in g),
    "vitamins": number (% DV),
    "potassium": number (mg),
    "phosphorus": number (mg)
  },
  "redFlags": [
    {
      "ingredient": "string",
      "reason": "clinical reason why this is hazardous for the patient",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    }
  ],
  "ingredientsBreakdown": [
    {
      "name": "string",
      "category": "Preservatives" | "Sweeteners" | "Flavorings" | "Emulsifiers" | "Stabilizers" | "Thickeners" | "Essential Nutrients" | "Core Matrix",
      "description": "clinical note on this ingredient"
    }
  ],
  "optimizationTips": ["clinical tip 1", "clinical tip 2"],
  "medicalWarning": "Concise medical warning statement for patient condition",
  "dailyImpact": {
    "calories": "e.g. 15% Daily Limit",
    "sodium": "e.g. 42% Daily Limit",
    "sugar": "e.g. 8% Daily Limit",
    "protein": "e.g. 12% Daily Target",
    "vitamins": "e.g. 5% Daily Target"
  },
  "recommendation": {
    "verdict": "Detailed clinical recommendation on whether to consume, limit, or avoid."
  },
  "compliance": {
    "whoSaltTarget": "COMPLIANT" | "NON_COMPLIANT",
    "nutriScore": "A" | "B" | "C" | "D" | "E"
  },
  "voiceResponse": "Natural tone spoken audio summary for the patient (under 30 words)."
}`;

const parseJSON = (text: string): AnalysisResult => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse JSON from Vision AI response:", text);
    throw new Error("Invalid response format from Vision AI.");
  }
};

export const analyzeProductWithGrok = async (
  imageB64: string,
  userProfile: UserProfile
): Promise<AnalysisResult> => {
  const grokApiKey =
    (typeof process !== 'undefined' && process.env?.GROK_API_KEY) ||
    (import.meta as any).env?.VITE_GROK_API_KEY ||
    localStorage.getItem('nutri_grok_api_key') ||
    '';

  if (!grokApiKey) {
    throw new Error(
      "Grok API Key is missing. Please provide your Grok (xAI) API key in .env.local as GROK_API_KEY or VITE_GROK_API_KEY."
    );
  }

  const diseaseContext = getDiseaseContext(userProfile);
  const prompt = `Perform a Clinical Audit for patient with ${diseaseContext}. 
Patient profile: Age ${userProfile.age}, Weight ${userProfile.weight}kg.
Inspect this food label / nutrition facts image and extract all nutrients, ingredients, warnings, and clinical score.`;

  // Support both xAI (xai-...) and GroqCloud (gsk_...) seamlessly
  const isGroq = grokApiKey.startsWith('gsk_');
  const endpoint = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.x.ai/v1/chat/completions';
  const model = isGroq
    ? 'llama-3.2-11b-vision-preview'
    : 'grok-2-vision-1212';

  // Format base64 data URI if not already present
  const imageUrl = imageB64.startsWith('data:')
    ? imageB64
    : `data:image/jpeg;base64,${imageB64}`;

  const requestBody = {
    model,
    messages: [
      {
        role: "system",
        content: SYSTEM_INSTRUCTION
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ],
    temperature: 0.2
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${grokApiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Grok Vision API Error:", response.status, errorText);
    throw new Error(`Vision AI request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content || '';
  return parseJSON(rawText);
};
