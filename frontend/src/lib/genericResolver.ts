import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiGenericResult {
  brand: string;
  generic: string;
  strength: string;
  ingredients: string[];
  notes: string;
}

function getGenAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY missing in .env.local');
  return new GoogleGenerativeAI(apiKey);
}

export async function resolveGenericWithGemini(brandName: string): Promise<GeminiGenericResult | null> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Find the generic medicine equivalent for the brand name "${brandName}".
Return ONLY a JSON object with exactly these keys:
{"brand": "<brand>", "generic": "<generic>", "strength": "<typical strength>", "ingredients": ["<ingredient1>", "<ingredient2>"], "notes": "Short note"}
If not found or not a medicine, return: {"error": "Not found"}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const obj = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
    if (obj.error) return null;
    return {
      brand: obj.brand || brandName,
      generic: obj.generic || '',
      strength: obj.strength || '',
      ingredients: Array.isArray(obj.ingredients) ? obj.ingredients : [],
      notes: obj.notes || ''
    };
  } catch {
    return null;
  }
}
