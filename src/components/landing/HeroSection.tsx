import { Camera, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import PrescriptionCard from "./PrescriptionCard";

interface HeroSectionProps {
  onScanClick: () => void;
}

const HeroSection = ({ onScanClick }: HeroSectionProps) => {
  const { t } = useLanguage();
  const [prescriptionText, setPrescriptionText] = useState("");

  const handleScan = () => {
    // Store the text in sessionStorage so dashboard can access it
    if (prescriptionText.trim()) {
      sessionStorage.setItem('manualPrescriptionText', prescriptionText);
    }
    onScanClick();
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
            { icon: "📷", text: "Instant Scan" },
            { icon: "🔍", text: "AI Recognition" },
            { icon: "🏥", text: "Pharmacy Finder" }
          ].map((feature, i) => (
            <div key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-primary/20 backdrop-blur-sm text-xs md:text-sm text-secondary hover:border-primary/40 transition-all">
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
          {/* Text Input Option */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Type className="w-4 h-4" />
              Write prescription details:
            </label>
            <textarea 
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              placeholder="e.g., Aspirin 500mg, 2x daily..."
              className="w-full h-20 p-2 rounded-lg border border-input bg-background text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-background text-muted-foreground">or</span>
            </div>
          </div>

          {/* Scan Button */}
          <Button 
            onClick={handleScan}
            className="w-full h-12 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Camera className="w-5 h-5 mr-2" />
            {t.hero.scanButton}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {t.hero.noAccount}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
