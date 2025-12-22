import { Crown, ShieldCheck } from "lucide-react";
import { usePlan } from "@/contexts/PlanContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PlanSwitcher = () => {
  const { plan, setPlan, usage } = usePlan();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="pill-badge bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          aria-label="Change plan"
        >
          {plan === 'premium' ? <Crown className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{plan === 'premium' ? 'Care (Premium)' : 'Free'}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-card border border-border rounded-2xl p-2 shadow-elevated">
        <DropdownMenuItem onClick={() => setPlan('free')} className="px-4 py-3 rounded-xl cursor-pointer hover:bg-accent">
          Free Tier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setPlan('premium')} className="px-4 py-3 rounded-xl cursor-pointer hover:bg-accent">
          Care (Premium)
        </DropdownMenuItem>
        <div className="px-4 pt-2 text-xs text-muted-foreground">
          Scans this month: {usage.scansThisMonth}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PlanSwitcher;
