import { ArrowRight, Bell, Pill, Check, Sparkles } from "lucide-react";

const PrescriptionCard = () => {
  return (
    <div className="relative w-full max-w-sm mx-auto py-6">
      {/* Container for both cards */}
      <div className="relative h-[280px]">
        {/* Prescription Paper (Back/Left) */}
        <div className="card-elevated p-5 absolute left-0 top-0 w-[75%] rotate-[-6deg] z-10 transform-gpu">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <span className="text-secondary font-bold text-base">Rx</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dr. Smith</p>
              <p className="text-base font-bold text-secondary">Prescription</p>
            </div>
          </div>
          
          {/* Fake handwriting lines */}
          <div className="space-y-3 pl-2">
            <div className="h-2.5 bg-muted rounded w-[85%]" />
            <div className="h-2.5 bg-muted rounded w-[60%]" />
            <div className="h-2.5 bg-muted rounded w-[75%]" />
            <div className="h-2.5 bg-muted rounded w-[45%]" />
          </div>

          {/* Signature */}
          <div className="mt-5 pt-4 border-t border-border">
            <div className="h-6 w-24 bg-muted/50 rounded" />
          </div>
        </div>

        {/* Arrow Connector */}
        <div className="absolute top-[45%] left-[52%] -translate-x-1/2 -translate-y-1/2 z-30 bg-primary rounded-full p-3.5 shadow-glow">
          <ArrowRight className="w-5 h-5 text-primary-foreground" />
        </div>

        {/* Phone Notification (Front/Right) */}
        <div className="card-elevated p-5 absolute right-0 top-8 w-[80%] rotate-[5deg] z-20 border-2 border-primary/30 transform-gpu">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">MediLingo Reminder</p>
              <p className="text-base font-semibold text-foreground leading-snug">
                Take 1 tablet of Metformin with breakfast
              </p>
            </div>
          </div>

          {/* Medicine Detail */}
          <div className="mt-4 p-3.5 bg-accent rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-foreground">Metformin 500mg</p>
              <p className="text-sm text-muted-foreground">For blood sugar control</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionCard;
