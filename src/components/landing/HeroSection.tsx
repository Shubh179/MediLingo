import { Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import PrescriptionCard from "./PrescriptionCard";

interface HeroSectionProps {
  onScanClick: () => void;
}

const HeroSection = ({ onScanClick }: HeroSectionProps) => {
  const { t } = useLanguage();

  return (
    <section className="min-h-screen pt-20 pb-40 px-5 flex flex-col">
      {/* Trust Badge */}
      <div className="flex justify-center mb-6 fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="pill-badge bg-accent text-primary border border-primary/20">
          <Sparkles className="w-4 h-4" />
          <span>{t.hero.trustBadge}</span>
        </div>
      </div>

      {/* Main Heading */}
      <div className="text-center mb-6 fade-up" style={{ animationDelay: "0.2s" }}>
        <h1 className="text-[2rem] md:text-4xl font-extrabold text-secondary leading-[1.15] mb-4">
          {t.hero.title1}
          <br />
          <span className="text-primary">{t.hero.title2}</span>
          <br />
          {t.hero.title3}
        </h1>
        <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">
          {t.hero.subtitle}
        </p>
      </div>

      {/* Visual Card - Prescription to Notification */}
      <div className="flex-1 flex items-center justify-center fade-up" style={{ animationDelay: "0.3s" }}>
        <PrescriptionCard />
      </div>

      {/* Bottom CTA Sheet */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent pt-16 slide-in-bottom">
        <div className="card-glow p-5 space-y-3 max-w-md mx-auto">
          <Button 
            variant="touch" 
            size="lg" 
            onClick={onScanClick}
            className="pulse-gentle"
          >
            <Camera className="w-6 h-6" />
            {t.hero.scanButton}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t.hero.noAccount}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
