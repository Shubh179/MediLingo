import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

type Plan = 'free' | 'premium';

interface UsageState {
  scansThisMonth: number;
  monthKey: string; // YYYY-MM
}

interface PlanContextType {
  plan: Plan;
  setPlan: (p: Plan) => void;
  usage: UsageState;
  canUseScan: () => boolean;
  recordScan: () => void;
  maxLanguages: number; // allowed simultaneous languages
}

const STORAGE_KEY = 'medilingo_plan_usage_v1';

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const getMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const DEFAULT_USAGE: UsageState = {
  scansThisMonth: 0,
  monthKey: getMonthKey(),
};

export const PlanProvider = ({ children }: { children: ReactNode }) => {
  const [plan, setPlanState] = useState<Plan>(() => {
    const saved = localStorage.getItem('medilingo_plan_tier');
    return saved === 'premium' ? 'premium' : 'free';
  });
  const [usage, setUsage] = useState<UsageState>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USAGE;
    try {
      const parsed = JSON.parse(raw) as UsageState;
      return parsed;
    } catch {
      return DEFAULT_USAGE;
    }
  });

  useEffect(() => {
    const currentKey = getMonthKey();
    if (usage.monthKey !== currentKey) {
      const next = { scansThisMonth: 0, monthKey: currentKey };
      setUsage(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, [usage.monthKey]);

  const setPlan = (p: Plan) => {
    setPlanState(p);
    localStorage.setItem('medilingo_plan_tier', p);
  };

  const freeScanLimit = 5;

  const canUseScan = () => {
    if (plan === 'premium') return true;
    return usage.scansThisMonth < freeScanLimit;
  };

  const recordScan = () => {
    setUsage((prev) => {
      const next = { ...prev, scansThisMonth: prev.scansThisMonth + 1 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const maxLanguages = useMemo(() => (plan === 'premium' ? 4 : 2), [plan]);

  const value: PlanContextType = {
    plan,
    setPlan,
    usage,
    canUseScan,
    recordScan,
    maxLanguages,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = () => {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
};
