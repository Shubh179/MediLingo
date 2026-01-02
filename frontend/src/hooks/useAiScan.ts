import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ScanResult {
  text: string;
  medicines?: {
    name: string;
    dosage: string;
    timing: string;
  }[];
}

// Helper function to parse medicines from OCR text
function parseMedicines(text: string) {
  const medicines: { name: string; dosage: string; timing: string }[] = [];
  
  // Common medicine patterns
  const lines = text.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Look for patterns like "Medicine 500mg" or "Tab Medicine"
    const medicineMatch = line.match(/(?:Tab\.|Syp\.|Cap\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(\d+\s*(?:mg|ml|g)?)/i);
    
    if (medicineMatch) {
      const name = medicineMatch[1].trim();
      const dosage = medicineMatch[2].trim();
      
      // Try to extract timing
      let timing = 'As directed';
      if (/morning|breakfast/i.test(line)) timing = 'Morning';
      else if (/afternoon|lunch/i.test(line)) timing = 'Afternoon';
      else if (/evening|dinner|night/i.test(line)) timing = 'Night';
      else if (/\b[0-9]-[0-9]-[0-9]\b/.test(line)) timing = 'As per schedule';
      
      medicines.push({ name, dosage, timing });
    }
  }
  
  return medicines.length > 0 ? medicines : undefined;
}

// Helper function to convert File to base64 (strips data URI prefix)
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip 'data:image/png;base64,' or similar prefix
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const useAiScan = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Primary method: Use Gemini API for OCR (vision model)
  const scanWithGemini = async (file: File): Promise<string | null> => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log('🔑 API Key check:', apiKey ? `Present (${apiKey.substring(0, 10)}...)` : 'NOT FOUND');

      if (!apiKey) {
        console.warn('⚠️ Gemini API key not configured, falling back to Tesseract');
        return null;
      }

      setProgress(10);
      console.log('🚀 Initializing Gemini AI...');
      const genAI = new GoogleGenerativeAI(apiKey);

      // Use gemini-2.5-flash (latest supported multimodal model)
      console.log('📦 Loading model: gemini-2.5-flash');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      setProgress(30);
      // Convert image to base64
      console.log('🖼️ Converting image to base64...');
      const base64Image = await fileToBase64(file);
      console.log('✓ Image converted, size:', Math.round(base64Image.length / 1024), 'KB');

      setProgress(50);
      // Prepare the prompt for prescription OCR
      console.log('📝 Sending request to Gemini Vision API...');
      const prompt = 'Transcribe this medical prescription exactly. List Patient Name, Date, Medications, and Instructions clearly. If something is unreadable, mark it as [unclear].';

      // Call Gemini Vision API with proper format
      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            data: base64Image,
            mimeType: file.type,
          },
        },
      ]);
      console.log('📨 Received response from Gemini');

      setProgress(90);
      const response = await result.response;
      let extractedText = response.text().trim();
      
      // Remove all asterisks (*) from the output
      extractedText = extractedText.replace(/\*/g, '');
      
      console.log('📄 Extracted text length:', extractedText.length, 'characters');

      if (!extractedText || extractedText.length < 5) {
        console.warn('⚠️ Gemini returned insufficient text, falling back to Tesseract');
        return null;
      }

      console.log('✅ Gemini OCR successful!');
      console.log('Preview:', extractedText.substring(0, 100) + '...');
      setProgress(100);
      return extractedText;
    } catch (e: any) {
      console.error('❌ Gemini OCR failed:', e?.message || e);
      console.error('Full error:', e);
      return null; // Return null to trigger fallback
    }
  };

  // Fallback method: Use Tesseract for OCR
  const scanWithTesseract = async (file: File): Promise<string> => {
    setProgress(0);
    console.log('🔄 Using Tesseract OCR as fallback...');

    const result = await Tesseract.recognize(
      file,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          } else if (m.status === 'initializing api') {
            setProgress(10);
          } else if (m.status === 'loading language traineddata') {
            setProgress(25);
          }
        },
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      }
    );

    const extractedText = result.data.text.trim();
    
    if (!extractedText || extractedText.length < 5) {
      throw new Error('No text detected in the image. Please upload a clearer prescription image.');
    }

    console.log('✅ Tesseract OCR successful:', extractedText.substring(0, 100));
    const confidence = result.data.confidence;
    console.log('Tesseract Confidence:', confidence);
    
    return extractedText;
  };

  const scan = async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPEG, PNG, etc.)');
      }

      // Step 1: Try Gemini API first (primary method for higher accuracy)
      console.log('📸 Starting prescription scan with Gemini AI...');
      const geminiResult = await scanWithGemini(file);
      
      if (geminiResult) {
        // Gemini successful
        const medicines = parseMedicines(geminiResult);
        console.log('Parsed medicines:', medicines);
        return geminiResult;
      }

      // Step 2: Fallback to Tesseract if Gemini fails or unavailable
      console.log('🔄 Gemini unavailable, using Tesseract fallback...');
      const tesseractResult = await scanWithTesseract(file);
      
      const medicines = parseMedicines(tesseractResult);
      console.log('Parsed medicines:', medicines);
      
      return tesseractResult;
    } catch (e: any) {
      console.error('OCR Error:', e);
      const fallback = 'Could not scan prescription. Please try again with a clearer image.';
      setError(e?.message || 'Failed to scan prescription');
      return fallback;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return { scan, loading, error, progress };
};
