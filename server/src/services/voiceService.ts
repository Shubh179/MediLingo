import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { GEMINI_API_KEY, GEMINI_MODEL, OPENAI_API_KEY } from '../config/env';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export interface TranscriptionResult {
  text: string;
}

export interface TTSResult {
  audioBase64: string;
  mimeType: string;
}

export const transcribeAudio = async (audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> => {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const input = [
    { text: 'Transcribe the following speech accurately. Return only the plain text transcription.' },
    { inlineData: { mimeType, data: audioBuffer.toString('base64') } },
  ];

  const result = await model.generateContent(input as any);
  const text = result.response.text();
  return { text };
};

export const synthesizeSpeech = async (text: string, voice: string = 'alloy', format: 'mp3' | 'wav' = 'mp3'): Promise<TTSResult | null> => {
  if (!openai) return null;
  // OpenAI TTS via gpt-4o-mini-tts
  const resp = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice,
    input: text,
    format,
  } as any);
  const arrayBuffer = await resp.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
  return { audioBase64, mimeType };
};
