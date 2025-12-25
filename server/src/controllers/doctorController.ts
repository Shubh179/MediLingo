import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/env';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

const DOCTOR_PERSONA_PROMPT = `You are Dr. Mayur, a friendly, empathetic, and knowledgeable virtual doctor. Always greet the user by name if provided, explain things in simple terms, and offer clear, actionable advice. If the user asks about a prescription, explain it in detail and check for safety. If you don't know, say so honestly.`;

export const doctorChat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided' });
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL || 'gemini-pro' });
    const prompt = `${DOCTOR_PERSONA_PROMPT}\n\nUser: ${message}\nDr. Mayur:`;
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const reply = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process your request.';
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get doctor response', details: err?.toString() });
  }
};
