import { Camera, Sparkles, MessageCircle, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import PrescriptionCard from "./PrescriptionCard";
import PrescriptionUpload from "./PrescriptionUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Chatbot from "@/components/chatbot/Chatbot";

interface HeroSectionProps {
  onScanClick: () => void;
  onFileSelected?: (file: File) => void;
}

const HeroSection = ({ onScanClick, onFileSelected }: HeroSectionProps) => {
  const { t } = useLanguage();
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);

  const handleScanClick = () => {
    setShowScanOptions(true);
  };

  const handleCameraClick = () => {
    setShowScanOptions(false);
    // Trigger camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Pass the file to the parent component for OCR processing
        onFileSelected?.(file);
        onScanClick();
      }
    };
    input.click();
  };

  const handleGalleryClick = () => {
    setShowScanOptions(false);
    // Trigger gallery upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Pass the file to the parent component for OCR processing
        onFileSelected?.(file);
        onScanClick();
      }
    };
    input.click();
  };

  const handleChat = () => {
    setChatInitialMessage(null);
    setShowChatbot(true);
  };

  const handleAIRecognition = () => {
    setChatInitialMessage(null);
    setShowChatbot(true);
  };

  const handlePharmacyFinder = () => {
    // Request location permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setChatInitialMessage(`Find pharmacies near my location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          setShowChatbot(true);
        },
        (error) => {
          // Handle error - still open chatbot with general pharmacy request
          setChatInitialMessage('Find nearby pharmacies');
          setShowChatbot(true);
        }
      );
    } else {
      // Geolocation not supported
      setChatInitialMessage('Find nearby pharmacies');
      setShowChatbot(true);
    }
  };

  return (
    <section className="min-h-screen h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-12 pb-12 px-5 flex flex-col relative overflow-hidden">
      {/* Grid background - entire page */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none z-0" style={{
        backgroundImage: `linear-gradient(to right, rgba(16, 185, 129, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.3) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {/* Prescription Upload Component */}
        <div className="w-full mb-6 fade-up" style={{ animationDelay: "0.1s" }}>
          <PrescriptionUpload 
            onCameraClick={handleCameraClick}
            onUploadClick={handleGalleryClick}
          />
        </div>

        {/* Chat Input Box */}
        <div className="w-full max-w-2xl mx-auto mb-4 fade-up" style={{ animationDelay: "0.15s" }}>
          <div 
            onClick={() => {
              setChatInitialMessage(null);
              setShowChatbot(true);
            }}
            className="flex items-center gap-3 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg cursor-text hover:border-primary/40 transition-all"
          >
            <MessageCircle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Ask me anything about your prescription...</span>
          </div>
        </div>

        {/* Features Pills */}
        <div className="flex flex-wrap justify-center gap-2 fade-up" style={{ animationDelay: "0.2s" }}>
          {[
            { icon: "📷", text: "Instant Scan", clickable: true, handler: handleScanClick },
            { icon: "🔍", text: "AI Recognition", clickable: true, handler: handleAIRecognition },
            { icon: "🏥", text: "Pharmacy Finder", clickable: true, handler: handlePharmacyFinder }
          ].map((feature, i) => (
            <div 
              key={i} 
              onClick={feature.clickable ? feature.handler : undefined}
              className={`px-4 py-2 rounded-lg bg-white border-2 border-gray-200 backdrop-blur-sm text-xs md:text-sm text-gray-700 hover:border-primary/40 transition-all ${
                feature.clickable ? 'cursor-pointer hover:bg-gray-50 hover:scale-105' : ''
              }`}
            >
              <span className="mr-1">{feature.icon}</span>{feature.text}
            </div>
          ))}
        </div>
      </div>

      {/* Scan Options Dialog */}
      <Dialog open={showScanOptions} onOpenChange={setShowScanOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Prescription</DialogTitle>
            <DialogDescription>
              Choose how you'd like to upload your prescription
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 mt-4">
            <Button
              onClick={handleCameraClick}
              className="w-full h-16 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600 text-white font-semibold rounded-xl"
            >
              <Video className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Use Camera</div>
                <div className="text-xs opacity-90">Take a photo now</div>
              </div>
            </Button>
            <Button
              onClick={handleGalleryClick}
              variant="outline"
              className="w-full h-16 border-2 border-primary hover:bg-primary/10 font-semibold rounded-xl"
            >
              <Upload className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Upload from Gallery</div>
                <div className="text-xs opacity-75">Choose existing photo</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chatbot Modal */}
      <Chatbot 
        isOpen={showChatbot} 
        onClose={() => {
          setShowChatbot(false);
          setChatInitialMessage(null);
        }} 
        initialMessage={chatInitialMessage}
      />
    </section>
  );
};

export default HeroSection;
