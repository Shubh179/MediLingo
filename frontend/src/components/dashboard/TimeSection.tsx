import { Sun, Sunrise, Moon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import MedicineCard from "./MedicineCard";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  pillType: "capsule" | "tablet" | "liquid";
  pillColor: string;
  isTaken?: boolean;
  isUrgent?: boolean;
}

interface TimeSectionProps {
  timeOfDay: "morning" | "afternoon" | "night";
  time: string;
  medicines: Medicine[];
  onSpeak?: (medicine: Medicine) => void;
  onMarkTaken?: (medicineId: string) => void;
}

const TimeSection = ({
  timeOfDay,
  time,
  medicines,
  onSpeak,
  onMarkTaken,
}: TimeSectionProps) => {
  const { t } = useLanguage();

  const timeConfig = {
    morning: {
      label: t.dashboard.morning,
      Icon: Sunrise,
      className: "time-section-morning",
      iconColor: "text-morning-accent",
    },
    afternoon: {
      label: t.dashboard.afternoon,
      Icon: Sun,
      className: "time-section-afternoon",
      iconColor: "text-afternoon-accent",
    },
    night: {
      label: t.dashboard.night,
      Icon: Moon,
      className: "time-section-night",
      iconColor: "text-night-accent",
    },
  };

  const config = timeConfig[timeOfDay];
  const Icon = config.Icon;

  return (
    <section className={`rounded-3xl p-5 ${config.className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-card shadow-sm flex items-center justify-center">
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-secondary">{config.label}</h2>
          <p className="text-sm text-muted-foreground">{time}</p>
        </div>
      </div>

      {/* Medicine Cards */}
      <div className="space-y-4">
        {medicines.map((medicine) => (
          <MedicineCard
            key={medicine.id}
            {...medicine}
            onSpeak={() => onSpeak?.(medicine)}
            onMarkTaken={() => onMarkTaken?.(medicine.id)}
          />
        ))}
      </div>

      {medicines.length === 0 && (
        <div className="card-elevated p-6 text-center">
          <p className="text-muted-foreground">{t.dashboard.noMedicines}</p>
        </div>
      )}
    </section>
  );
};

export default TimeSection;
