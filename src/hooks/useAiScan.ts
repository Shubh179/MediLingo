import { useState } from 'react';
import Tesseract from 'tesseract.js';

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

export const useAiScan = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const scan = async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPEG, PNG, etc.)');
      }

      // Use Tesseract.js for free OCR with comprehensive configuration
      const result = await Tesseract.recognize(
        file,
        // Support multiple languages for better accuracy
        // 'eng+hin+mar' for English, Hindi, and Marathi
        // You can customize based on your needs
        'eng',
        {
          logger: (m) => {
            // Update progress during OCR processing
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            } else if (m.status === 'initializing api') {
              setProgress(10);
            } else if (m.status === 'loading language traineddata') {
              setProgress(25);
            }
          },
          // Improve accuracy with these settings
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        }
      );

      const extractedText = result.data.text.trim();
      
      if (!extractedText || extractedText.length < 5) {
        throw new Error('No text detected in the image. Please upload a clearer prescription image.');
      }

      // Confidence score check
      const confidence = result.data.confidence;
      console.log('OCR Confidence:', confidence);
      
      // Parse medicine information from the text (optional, for future use)
      const medicines = parseMedicines(extractedText);
      console.log('Parsed medicines:', medicines);

      return extractedText;
    } catch (e: any) {
      console.error('OCR Error:', e);
      const fallback = 'Could not scan prescription. Please try again with a clearer image or check your internet connection.';
      setError(e?.message || 'Failed to scan prescription');
      return fallback;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return { scan, loading, error, progress };
};
