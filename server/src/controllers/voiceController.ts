import { Request, Response } from 'express';
import { transcribeAudio, synthesizeSpeech } from '../services/voiceService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/env';
import { MedicalHistory } from '../models/MedicalHistory';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

export const chatFromAudio = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as any;
    const { userId } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'audio file is required under form field "audio"' });
    }

    // 1) Transcribe
    const transcription = await transcribeAudio(file.buffer, file.mimetype);

    // 2) Build context
    const history = userId ? await MedicalHistory.findOne({ userId }) : null;
    const context = history 
      ? `Patient History: ${history.chronicConditions.join(', ')}. Current Meds: ${history.activeMedications.map(m => m.name).join(', ')}.`
      : 'No previous history found.';

    const chatPrompt = `
      You are MediLingo, a helpful medical assistant.
      Context: ${context}
      User Question (transcribed): ${transcription.text}
      Answer clearly and remind the user to consult a doctor for emergencies.
    `;

    // 3) Chat with Gemini
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(chatPrompt);
    const replyText = result.response.text();

    // 4) Optional TTS
    const tts = await synthesizeSpeech(replyText);

    return res.status(200).json({
      transcript: transcription.text,
      replyText,
      replyAudioBase64: tts?.audioBase64,
      replyAudioMimeType: tts?.mimeType,
    });
  } catch (error) {
    console.error('Voice chat error:', error);
    return res.status(500).json({ error: 'Voice agent failed', details: (error as any)?.message });
  }
};

export const transcribeOnly = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as any;
    if (!file) {
      return res.status(400).json({ error: 'audio file is required under form field "audio"' });
    }
    const transcription = await transcribeAudio(file.buffer, file.mimetype);
    return res.status(200).json({ transcript: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: 'Transcription failed', details: (error as any)?.message });
  }
};
