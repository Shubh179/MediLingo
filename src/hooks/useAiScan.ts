import { useState } from 'react';

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const useAiScan = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const image = await fileToBase64(file);
      const res = await fetch('http://localhost:4000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, name: file.name, type: file.type }),
      });
      if (!res.ok) {
        throw new Error('Scan failed');
      }
      const data = await res.json();
      return data.text as string;
    } catch (e: any) {
      // Fallback text so the user still advances
      const fallback = 'We could not reach the scan service. Please try again later.';
      setError(e?.message || 'Failed to scan');
      return fallback;
    } finally {
      setLoading(false);
    }
  };

  return { scan, loading, error };
};
