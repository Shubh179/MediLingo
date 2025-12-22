import { Camera, Sparkles, MessageCircle, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import PrescriptionCard from "./PrescriptionCard";
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
    <section className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-12 pb-80 px-5 flex flex-col overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-start">
        {/* Trust Badge */}
        <div className="flex justify-center mb-6 fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm hover:border-primary/50 transition-all">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{t.hero.trustBadge}</span>
          </div>
        </div>

        {/* Main Heading - Premium Typography */}
        <div className="text-center mb-8 fade-up max-w-3xl" style={{ animationDelay: "0.2s" }}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-tight mb-4 tracking-tight">
            {t.hero.title1}
            <br />
            <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              {t.hero.title2}
            </span>
            <br />
            {t.hero.title3}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
            {t.hero.subtitle}
          </p>
        </div>

        {/* Features Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 fade-up" style={{ animationDelay: "0.25s" }}>
          {[
            { icon: "📷", text: "Instant Scan", clickable: true, handler: handleScanClick },
            { icon: "🔍", text: "AI Recognition", clickable: true, handler: handleAIRecognition },
            { icon: "🏥", text: "Pharmacy Finder", clickable: true, handler: handlePharmacyFinder }
          ].map((feature, i) => (
            <div 
              key={i} 
              onClick={feature.clickable ? feature.handler : undefined}
              className={`px-3 py-1.5 rounded-lg bg-white/5 border border-primary/20 backdrop-blur-sm text-xs md:text-sm text-secondary hover:border-primary/40 transition-all ${
                feature.clickable ? 'cursor-pointer hover:bg-primary/10 hover:scale-105' : ''
              }`}
            >
              <span className="mr-1">{feature.icon}</span>{feature.text}
            </div>
          ))}
        </div>

        {/* Visual Card - Prescription to Notification */}
        <div className="flex-1 flex items-center justify-center w-full mb-12 fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-3xl blur-2xl"></div>
            <div className="relative">
              <PrescriptionCard />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Sheet - Fixed Position */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pt-12 z-40">
        <div className="card-glow p-5 space-y-3 max-w-md mx-auto rounded-2xl border border-primary/30">
          {/* Two Main Options */}
          <div className="grid grid-cols-1 gap-3">
            {/* Scan Prescription Button */}
            <Button 
              onClick={handleScanClick}
              className="w-full h-14 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Camera className="w-5 h-5 mr-2" />
              Scan Prescription
            </Button>

            {/* Chat with Me Button */}
            <Button 
              onClick={handleChat}
              variant="outline"
              className="w-full h-14 border-2 border-primary hover:bg-primary/10 font-semibold rounded-xl transition-all"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat with me
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {t.hero.noAccount}
          </p>
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
