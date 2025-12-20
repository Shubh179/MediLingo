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
      // Use Tesseract.js for OCR with better configuration
      const result = await Tesseract.recognize(
        file,
        'eng', // You can add more languages: 'eng+hin+mar' for multilingual support
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
          // Improve accuracy with these settings
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        }
      );

      const extractedText = result.data.text;
      
      if (!extractedText || extractedText.trim().length < 5) {
        throw new Error('No text detected in the image. Please upload a clearer prescription.');
      }

      // Parse medicine information from the text (optional, for future use)
      const medicines = parseMedicines(extractedText);
      console.log('Parsed medicines:', medicines);

      return extractedText;
    } catch (e: any) {
      console.error('OCR Error:', e);
      const fallback = 'Could not scan prescription. Please try again with a clearer image.';
      setError(e?.message || 'Failed to scan');
      return fallback;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return { scan, loading, error, progress };
};
