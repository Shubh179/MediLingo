import { Globe, Check } from "lucide-react";
import { Language, languageNames } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlan } from "@/contexts/PlanContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  // Always expose four languages as requested
  const languages: Language[] = ['en', 'hi', 'mr', 'gu'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="pill-badge bg-accent text-accent-foreground hover:bg-accent/80 transition-colors cursor-pointer"
          aria-label="Change language"
        >
          <Globe className="w-4 h-4" />
          <span>{languageNames[language]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-40 bg-card border border-border rounded-2xl p-2 shadow-elevated"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer hover:bg-accent focus:bg-accent text-base font-medium"
          >
            <span>{languageNames[lang]}</span>
            {language === lang && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
