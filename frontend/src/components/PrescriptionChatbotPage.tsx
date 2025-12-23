import { useState, useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PhotoUpload from '@/components/upload/PhotoUpload';
import AdvancedChatbot from '@/components/AdvancedChatbot';
import { useMedicineHistory } from '@/contexts/MedicineHistoryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useAiScan } from '@/hooks/useAiScan';
import { ScrollArea } from '@/components/ui/scroll-area';
import jsPDF from 'jspdf';

interface PrescriptionChatbotPageProps {
  onBack: () => void;
}

const PrescriptionChatbotPage = ({ onBack }: PrescriptionChatbotPageProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
  const { addMedicines } = useMedicineHistory();

  // Debug: Log current user state
  useEffect(() => {
    console.log('📋 PrescriptionChatbotPage mounted');
    console.log('👤 Current user:', user);
    console.log('🔗 API URL:', API_BASE_URL);
  }, [user, API_BASE_URL]);
  const { scan } = useAiScan();

  const [showUpload, setShowUpload] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState<string | null>(null);
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);

  const downloadTextAsPDF = () => {
    if (!prescriptionText) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const maxWidth = pageWidth - 2 * margin;
    
    // Title
    doc.setFontSize(16);
    doc.text('Prescription OCR Analysis', margin, margin + 10);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, margin + 20);
    
    // Extracted Text
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(prescriptionText, maxWidth);
    doc.text(splitText, margin, margin + 30);
    
    doc.save('prescription-analysis.pdf');
    toast({
      title: 'PDF Downloaded',
      description: 'Prescription text saved as PDF',
    });
  };

  const handleUpload = async (file: File) => {
    setIsProcessing(true);

    try {
      // Read file as base64 for display
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        setPrescriptionImage(base64Image);

        try {
          // Extract text using Tesseract OCR
          const extractedText = await scan(file);
          setPrescriptionText(extractedText);

          // Simple parsing for medicines
          const lines = extractedText.split('\n').filter(line => line.trim());
          const medicines = [];
          
          for (const line of lines) {
            // Look for patterns like "Medicine 500mg" or "Tab Medicine"
            const medicineMatch = line.match(/(?:Tab\.|Syp\.|Cap\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(\d+\s*(?:mg|ml|g)?)/i);
            
            if (medicineMatch) {
              const name = medicineMatch[1].trim();
              const dosage = medicineMatch[2].trim();
              
              let timing = 'As directed';
              if (/morning|breakfast/i.test(line)) timing = 'Morning';
              else if (/afternoon|lunch/i.test(line)) timing = 'Afternoon';
              else if (/evening|dinner|night/i.test(line)) timing = 'Night';
              
              medicines.push({
                id: `med_${medicines.length}`,
                name,
                dosage,
                instructions: `Take ${dosage} ${timing.toLowerCase()}`,
              });
            }
          }

          // Add medicines to context
          if (medicines.length > 0) {
            addMedicines(medicines);

            toast({
              title: 'Prescription analyzed!',
              description: `Found ${medicines.length} medicine(s) in your prescription.`,
            });
          } else {
            toast({
              title: 'Prescription scanned',
              description: 'Text extracted. You can now chat about your medicines.',
            });
          }

          // Send OCR text to backend to store prescription (requires login for userId)
          if (!user?.id) {
            console.warn('⚠️ User not logged in, skipping prescription save');
            toast({
              title: 'Login to save prescriptions',
              description: 'Sign in to store this prescription in your account.',
            });
          } else {
            try {
              console.log('📤 Saving prescription for user:', user.id);
              const resp = await fetch(`${API_BASE_URL}/api/prescriptions/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  userId: user.id,
                  rawOcrText: extractedText,
                  targetLanguage: language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Marathi',
                }),
              });

              console.log('✅ Response status:', resp.status);
              
              if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData?.message || `Server error: ${resp.status}`);
              }

              const data = await resp.json();
              console.log('✅ Backend response:', data);
              
              if (data?.success) {
                toast({
                  title: 'Prescription saved!',
                  description: `Stored ${data.prescription?.medicinesCount || 0} medicines in your account.`,
                });
              } else {
                throw new Error(data?.message || 'Save failed');
              }
            } catch (saveErr) {
              console.error('❌ Save prescription error:', saveErr);
              toast({
                title: 'Could not save prescription',
                description: saveErr instanceof Error ? saveErr.message : 'Server error while saving',
                variant: 'destructive',
              });
            }
          }

          setShowUpload(false);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to analyze prescription';
          toast({
            title: 'Analysis failed',
            description: errorMsg,
            variant: 'destructive',
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-secondary">Prescription & Medicine Assistant</h1>
            <p className="text-xs text-muted-foreground">Upload prescription • Track doses • Find hospitals</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Prescription Upload Section */}
        <div className="space-y-4">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Prescription</h2>

            {prescriptionImage ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-border h-64 bg-muted flex items-center justify-center">
                  {prescriptionImage.startsWith('data:image') ? (
                    <img
                      src={prescriptionImage}
                      alt="Prescription"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <p className="text-muted-foreground">PDF Prescription</p>
                    </div>
                  )}
                </div>

                {prescriptionText && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">📄 Extracted Text:</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={downloadTextAsPDF}
                        className="flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </Button>
                    </div>
                    <ScrollArea className="border border-border rounded-lg bg-white/50 h-48">
                      <div className="p-4 text-xs text-secondary whitespace-pre-wrap leading-relaxed">
                        {prescriptionText}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setPrescriptionImage(null);
                    setPrescriptionText(null);
                    setShowUpload(true);
                  }}
                  className="w-full"
                >
                  Upload Different Prescription
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowUpload(true)}
                variant="outline"
                className="w-full py-8"
              >
                {isProcessing ? 'Processing...' : 'Click to Upload Prescription'}
              </Button>
            )}

            {showUpload && (
              <PhotoUpload
                onUpload={handleUpload}
                onCancel={() => setShowUpload(false)}
                isProcessing={isProcessing}
              />
            )}

            {isProcessing && (
              <div className="bg-muted rounded p-4 space-y-2">
                <p className="text-sm font-medium">Analyzing prescription with AI OCR...</p>
                <div className="w-full bg-border rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                </div>
              </div>
            )}
          </div>

          {/* Tips Section */}
          {!showUpload && (
            <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Tips</h3>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Upload a clear photo of your prescription</li>
                <li>• Ensure text is readable for better extraction</li>
                <li>• AI analyzes medicines automatically</li>
                <li>• Ask questions about your medications</li>
              </ul>
            </div>
          )}
        </div>

        {/* Right: Chatbot Section */}
        <div className="h-full flex flex-col min-h-[600px] bg-white/50 backdrop-blur-sm rounded-xl border border-border shadow-sm overflow-hidden">
          <AdvancedChatbot prescriptionText={prescriptionText || undefined} />
        </div>
      </div>
    </div>
  );
};

export default PrescriptionChatbotPage;
