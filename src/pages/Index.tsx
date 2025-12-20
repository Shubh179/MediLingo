import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import GlassNav from "@/components/layout/GlassNav";
import HeroSection from "@/components/landing/HeroSection";
import DashboardView from "@/components/dashboard/DashboardView";
import PhotoUpload from "@/components/upload/PhotoUpload";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { PlanProvider, usePlan } from "@/contexts/PlanContext";
import { toast } from "@/components/ui/use-toast";
import { useAiScan } from "@/hooks/useAiScan";

type View = "landing" | "upload" | "dashboard";

const IndexContent = () => {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [isProcessing, setIsProcessing] = useState(false);
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [decipherText, setDecipherText] = useState<string | null>(null);
  const { t } = useLanguage();
  const { plan, canUseScan, recordScan, usage } = usePlan();
  const { scan } = useAiScan();

  // Lock scroll on landing/upload so the page feels fixed-height
  useEffect(() => {
    const shouldLock = currentView !== "dashboard";
    if (shouldLock) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [currentView]);

  const handleScanClick = () => {
    if (!canUseScan()) {
      toast({
        title: "Scan limit reached",
        description:
          plan === "free"
            ? `Free tier allows 5 deciphers/month. Used: ${usage.scansThisMonth}. Upgrade for unlimited.`
            : "You have reached a temporary limit.",
        variant: "destructive",
      });
      return;
    }
    setCurrentView("upload");
  };

  const handleUpload = async (file: File) => {
    setIsProcessing(true);
    setDecipherText(null);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPrescriptionImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    try {
      const text = await scan(file);
      setDecipherText(text);
      
      const isServerDown = text.includes('could not reach');
      if (!isServerDown) {
        toast({ title: "Scan complete", description: "We deciphered your prescription." });
      } else {
        toast({ title: "Using demo mode", description: "Server offline. Showing sample data.", variant: "default" });
      }

      if (plan === 'premium' && !isServerDown) {
        try {
          const uid = (() => {
            const existing = localStorage.getItem('medilingo_user_id');
            if (existing) return existing;
            const gen = Math.random().toString(36).slice(2);
            localStorage.setItem('medilingo_user_id', gen);
            return gen;
          })();
          await fetch('http://localhost:4000/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: uid, imageUrl: prescriptionImage, text }),
          });
        } catch (e) {
          // ignore failures silently for now
        }
      }

      recordScan();
      setIsProcessing(false);
      setCurrentView("dashboard");
    } catch (e) {
      setIsProcessing(false);
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleCancelUpload = () => {
    setCurrentView("landing");
    setIsProcessing(false);
    setPrescriptionImage(null);
  };

  if (currentView === "dashboard") {
    return (
      <>
        <Helmet>
          <title>{t.dashboard.title} | MediLingo</title>
          <meta name="description" content="View your daily medicine schedule with clear instructions and reminders." />
        </Helmet>
        <DashboardView 
          onBack={() => {
            setCurrentView("landing");
            setPrescriptionImage(null);
            setDecipherText(null);
          }} 
          prescriptionImage={prescriptionImage}
          decipherText={decipherText}
        />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>MediLingo - {t.hero.title2} {t.hero.title3}</title>
        <meta name="description" content={t.hero.subtitle} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <GlassNav />
        <HeroSection onScanClick={handleScanClick} />
        
        {currentView === "upload" && (
          <PhotoUpload 
            onUpload={handleUpload}
            onCancel={handleCancelUpload}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </>
  );
};

const Index = () => {
  return (
    <LanguageProvider>
      <IndexContent />
    </LanguageProvider>
  );
};

export default Index;
