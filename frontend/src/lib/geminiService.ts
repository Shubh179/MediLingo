import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GeminiResponse {
  text: string;
  actionType?: 'record_dose' | 'find_hospital' | 'show_history' | 'general';
  medicineData?: {
    medicineName: string;
    doses: number;
    doseUnit: string;
  };
}

const SYSTEM_PROMPT = `You are a helpful medicine assistant. Your role is to:
1. Help users track their medicine doses
2. Answer questions about their medicines
3. Help find nearby hospitals/clinics
4. Maintain medicine history and provide recommendations
5. Give personalized medical advice based on user's prescription and history

When user asks to record doses, respond with JSON in format:
{"type": "record_dose", "medicine": "medicine_name", "doses": number, "unit": "tablets/ml/capsules"}

When user asks to find hospitals, respond with:
{"type": "find_hospital", "text": "I'll help you find nearby hospitals..."}

When user asks for history, respond with:
{"type": "show_history", "text": "Here's your dose history..."}

Otherwise provide helpful advice and information.

Always:
- Be clear and concise
- Ask clarifying questions if needed
- Remind users to follow doctor's prescriptions
- Be empathetic and helpful`;

function getGenAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured. Please add it to .env.local file.');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[],
  medicineList: string[] = [],
  doseHistory: string = ''
): Promise<GeminiResponse> {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build context with user's medicine data
    const contextMessage = `
Current medicines: ${medicineList.length > 0 ? medicineList.join(', ') : 'None uploaded yet'}
Recent dose history: ${doseHistory || 'No history yet'}
User message: ${userMessage}
    `;

    const messages: ChatMessage[] = [
      ...conversationHistory,
      {
        role: 'user',
        content: contextMessage,
      },
    ];

    const result = await model.generateContent({
      contents: messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
      systemInstruction: SYSTEM_PROMPT,
    });

    const responseText = result.response.text();

    // Try to parse structured response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.type === 'record_dose') {
          return {
            text: `Recorded ${parsed.doses} ${parsed.unit} of ${parsed.medicine}`,
            actionType: 'record_dose',
            medicineData: {
              medicineName: parsed.medicine,
              doses: parsed.doses,
              doseUnit: parsed.unit,
            },
          };
        } else if (parsed.type === 'find_hospital') {
          return {
            text: parsed.text || 'Finding nearby hospitals...',
            actionType: 'find_hospital',
          };
        } else if (parsed.type === 'show_history') {
          return {
            text: parsed.text || 'Retrieving your dose history...',
            actionType: 'show_history',
          };
        }
      }
    } catch (e) {
      // Continue with regular response
    }

    return {
      text: responseText,
      actionType: 'general',
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to get response from Gemini API';
    throw new Error(errorMsg);
  }
}

export function extractMedicinesFromText(text: string): string[] {
  // Simple extraction of medicine names from prescription text
  const lines = text.split('\n');
  const medicines: string[] = [];
  
  // Look for common patterns
  const medicinePattern = /^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?(?:\s+\d+\s*(?:mg|ml|%|IU))?/gm;
  
  lines.forEach(line => {
    const match = line.match(medicinePattern);
    if (match) {
      match.forEach(m => {
        const medicineName = m.replace(/\s+\d+.*$/g, '').trim();
        if (medicineName.length > 2 && !medicines.includes(medicineName)) {
          medicines.push(medicineName);
        }
      });
    }
  });

  return medicines.slice(0, 15); // Limit to 15 medicines
}
