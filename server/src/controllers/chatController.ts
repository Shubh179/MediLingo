import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/env';
import { MedicalHistory } from '../models/MedicalHistory';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const candidateModels = [
  GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.5-flash-latest',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b-latest',
  'gemini-1.5-pro-latest',
].filter(Boolean);

const isNotFound = (err: unknown) => {
  const msg = (err as any)?.message || String(err);
  return msg.toLowerCase().includes('not found');
};

export const handleChat = async (req: Request, res: Response) => {
  try {
    const { userId, userMessage } = req.body;

    // 1. Fetch the Patient's History to give Gemini context
    const history = await MedicalHistory.findOne({ userId });
    const context = history 
      ? `Patient History: ${history.chronicConditions.join(", ")}. Current Meds: ${history.activeMedications.map(m => m.name).join(", ")}.`
      : "No previous history found.";

    // 2. Ask Gemini with Context (fall back across known working models when 404 occurs)
    const chatPrompt = `
      You are MediLingo, a helpful medical assistant.
      Context: ${context}
      User Question: ${userMessage}
      Answer clearly and remind the user to consult a doctor for emergencies.
    `;

    let lastError: unknown;
    for (const modelId of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent(chatPrompt);
        return res.status(200).json({ reply: result.response.text() });
      } catch (err) {
        lastError = err;
        if (isNotFound(err)) {
          continue;
        }
        break;
      }
    }

    console.error('Chatbot Error:', lastError);
    res.status(500).json({ error: 'Chatbot failed', details: (lastError as any)?.message });
  } catch (error) {
    console.error('Chatbot Error:', error);
    res.status(500).json({ error: 'Chatbot failed', details: (error as any)?.message });
  }
};