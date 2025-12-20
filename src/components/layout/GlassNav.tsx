import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import PlanSwitcher from "./PlanSwitcher";

const GlassNav = () => {
  const { t } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="container flex items-center justify-between h-16 px-5">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">M</span>
          </div>
          <span className="font-bold text-xl text-secondary">{t.nav.appName}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <PlanSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default GlassNav;
