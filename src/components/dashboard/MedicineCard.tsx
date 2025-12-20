import { Volume2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface MedicineCardProps {
  name: string;
  dosage: string;
  instructions: string;
  pillType: "capsule" | "tablet" | "liquid";
  pillColor: string;
  isTaken?: boolean;
  isUrgent?: boolean;
  onSpeak?: () => void;
  onMarkTaken?: () => void;
}

const PillIcon = ({ type, color }: { type: string; color: string }) => {
  if (type === "capsule") {
    return (
      <div className="w-10 h-5 rounded-full flex overflow-hidden shadow-sm">
        <div className={`w-1/2 ${color}`} />
        <div className="w-1/2 bg-card border border-border" />
      </div>
    );
  }
  
  if (type === "liquid") {
    return (
      <div className={`w-8 h-10 rounded-lg ${color} flex items-end justify-center pb-1`}>
        <div className="w-4 h-4 bg-card/30 rounded-full" />
      </div>
    );
  }

  // tablet
  return (
    <div className={`w-8 h-8 rounded-full ${color} shadow-sm flex items-center justify-center`}>
      <div className="w-6 h-0.5 bg-card/30 rounded" />
    </div>
  );
};

const MedicineCard = ({
  name,
  dosage,
  instructions,
  pillType,
  pillColor,
  isTaken = false,
  isUrgent = false,
  onSpeak,
  onMarkTaken,
}: MedicineCardProps) => {
  const { t } = useLanguage();

  return (
    <div 
      className={`card-elevated p-4 transition-all duration-300 ${
        isTaken ? "opacity-60 bg-muted/50" : ""
      } ${isUrgent ? "border-destructive/50 border-2" : ""}`}
    >
      {isUrgent && (
        <div className="flex items-center gap-2 text-destructive mb-3 text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          <span>{t.dashboard.missedDose}</span>
        </div>
      )}
      
      <div className="flex items-start gap-4">
        {/* Pill Visual */}
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
          <PillIcon type={pillType} color={pillColor} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-lg leading-tight mb-1">
            {name}
          </h3>
          <p className="text-primary font-semibold text-base mb-1">{dosage}</p>
          <p className="text-muted-foreground text-sm">{instructions}</p>
        </div>

        {/* Audio Button */}
        <Button 
          variant="glass" 
          size="icon" 
          onClick={onSpeak}
          aria-label={t.dashboard.listenInstructions}
          className="flex-shrink-0"
        >
          <Volume2 className="w-5 h-5 text-primary" />
        </Button>
      </div>

      {/* Mark as Taken */}
      {!isTaken && (
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={onMarkTaken}
        >
          <Check className="w-5 h-5" />
          {t.dashboard.markAsTaken}
        </Button>
      )}

      {isTaken && (
        <div className="flex items-center justify-center gap-2 mt-4 py-3 bg-accent rounded-2xl text-primary font-medium">
          <Check className="w-5 h-5" />
          <span>{t.dashboard.takenLabel}</span>
        </div>
      )}
    </div>
  );
};

export default MedicineCard;
