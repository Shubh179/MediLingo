import { useState } from "react";
import { ArrowLeft, Calendar, Bell, AlertTriangle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import TimeSection from "./TimeSection";
import PharmacyFinder from "@/components/PharmacyFinder";
import { HospitalFinder } from "@/components/HospitalFinder";
import Chatbot from "@/components/Chatbot";
import PriceComparison from "@/components/PriceComparison";
import AdvancedChatbot from "@/components/AdvancedChatbot";
import { useAlarm } from "@/hooks/useAlarm";
import { toast } from "@/components/ui/use-toast";
import { usePlan } from "@/contexts/PlanContext";
import { generateMultilingualReport } from "@/lib/report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface DashboardViewProps {
  onBack: () => void;
  prescriptionImage?: string | null;
  decipherText?: string | null;
}

// Sample data - in a real app this would come from the scanned prescription
const sampleMedicines = {
  morning: [
    {
      id: "1",
      name: "Metformin",
      dosage: "Take 1 tablet",
      instructions: "With breakfast, drink plenty of water",
      pillType: "tablet" as const,
      pillColor: "bg-primary",
      isTaken: true,
    },
    {
      id: "2",
      name: "Lisinopril",
      dosage: "Take 1 tablet",
      instructions: "For blood pressure, take at the same time daily",
      pillType: "tablet" as const,
      pillColor: "bg-secondary",
      isTaken: false,
    },
  ],
  afternoon: [
    {
      id: "3",
      name: "Vitamin D3",
      dosage: "Take 1 capsule",
      instructions: "With lunch for better absorption",
      pillType: "capsule" as const,
      pillColor: "bg-amber-400",
      isTaken: false,
    },
  ],
  night: [
    {
      id: "4",
      name: "Atorvastatin",
      dosage: "Take 1 tablet",
      instructions: "Before bed for cholesterol management",
      pillType: "tablet" as const,
      pillColor: "bg-rose-400",
      isTaken: false,
      isUrgent: true,
    },
    {
      id: "5",
      name: "Cough Syrup",
      dosage: "Take 10ml",
      instructions: "Use the measuring cup provided",
      pillType: "liquid" as const,
      pillColor: "bg-purple-400",
      isTaken: false,
    },
  ],
};

const DashboardView = ({ onBack, prescriptionImage, decipherText }: DashboardViewProps) => {
  const { t, language } = useLanguage();
  const { plan } = usePlan();
  const { schedule, cancelAll } = useAlarm();

  const handleSpeak = (medicine: any) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `${medicine.name}. ${medicine.dosage}. ${medicine.instructions}`
      );
      utterance.rate = 0.9;
      utterance.pitch = 1;
      // Set language based on current selection
      if (language === 'hi') {
        utterance.lang = 'hi-IN';
      } else if (language === 'mr') {
        utterance.lang = 'mr-IN';
      } else {
        utterance.lang = 'en-US';
      }
      speechSynthesis.speak(utterance);
    }
  };

  const handleMarkTaken = (medicineId: string) => {
    console.log(`Marked ${medicineId} as taken`);
  };

  const today = new Date().toLocaleDateString(
    language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US', 
    { weekday: 'long', month: 'long', day: 'numeric' }
  );

  const parseTime = (time12h: string) => {
    const [time, ampm] = time12h.split(' ');
    const [hh, mm] = time.split(':').map((x) => parseInt(x, 10));
    let hours = hh % 12;
    if (ampm.toUpperCase() === 'PM') hours += 12;
    const d = new Date();
    d.setHours(hours, mm, 0, 0);
    // if time already passed today, schedule for tomorrow
    if (d.getTime() < Date.now()) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  };

  const enableReminders = async () => {
    const ok1 = await schedule(parseTime('8:00 AM'), 'Morning Medicines', 'It\'s time to take your morning dose.');
    const ok2 = await schedule(parseTime('1:00 PM'), 'Afternoon Medicines', 'Gentle reminder for your afternoon dose.');
    const ok3 = await schedule(parseTime('9:00 PM'), 'Night Medicines', 'Please take your night dose.');
    if (ok1 || ok2 || ok3) {
      toast({ title: 'Reminders enabled', description: 'Browser notifications will alert you at scheduled times.' });
    } else {
      toast({ title: 'Notification blocked', description: 'Please allow notifications in your browser settings.', variant: 'destructive' });
    }
  };

  const sendMissedDoseAlert = async () => {
    if (plan !== 'premium') {
      toast({ title: 'Premium feature', description: 'Caregiver alerts are available in the Care plan.' });
      return;
    }
    const phone = prompt('Enter caregiver WhatsApp number (with country code):');
    if (!phone) return;
    try {
      const msg = 'Missed dose detected. Please check in with the patient.';
      const r = await fetch('http://localhost:4000/api/caregiver-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: msg }),
      });
      if (r.ok) {
        toast({ title: 'Alert sent', description: 'Caregiver has been notified via WhatsApp.' });
      } else {
        toast({ title: 'Failed to send', description: 'Server error when sending alert.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to send', description: 'Could not reach alert service.', variant: 'destructive' });
    }
  };

  const downloadReport = () => {
    const allLangs: ('en'|'hi'|'mr')[] = ['en','hi','mr'];
    const unique = [language, 'en', ...allLangs.filter((l) => l !== language)];
    const langs = Array.from(new Set(unique)).slice(0, plan === 'premium' ? 4 : 2) as ('en'|'hi'|'mr')[];
    generateMultilingualReport(langs, 'Medication schedule and instructions.');
  };

  const [waPhone, setWaPhone] = useState(() => localStorage.getItem('medilingo_caregiver_phone') || "+91");
  const [saveCaregiver, setSaveCaregiver] = useState(() => localStorage.getItem('medilingo_caregiver_phone') ? true : false);
  
  // Generate smart message with next medicine
  const nextMedicine = sampleMedicines.afternoon[0] || sampleMedicines.night[0];
  const defaultMsg = nextMedicine 
    ? `Reminder: ${nextMedicine.name} - ${nextMedicine.dosage}. ${nextMedicine.instructions}`
    : "Missed dose detected. Please check in with the patient.";
  const [waMsg, setWaMsg] = useState(defaultMsg);

  const openWhatsApp = () => {
    const num = waPhone.replace(/\s|-/g, "");
    if (!/^\+?\d{8,15}$/.test(num)) {
      toast({ title: "Invalid number", description: "Use country code, e.g. +9198xxxxxxx", variant: "destructive" });
      return;
    }
    if (saveCaregiver) {
      localStorage.setItem('medilingo_caregiver_phone', waPhone);
    } else {
      localStorage.removeItem('medilingo_caregiver_phone');
    }
    const msg = encodeURIComponent(waMsg || defaultMsg);
    const digitsOnly = num.startsWith("+") ? num.slice(1) : num;
    window.open(`https://wa.me/${digitsOnly}?text=${msg}`, "_blank");
  };

  const ReminderCard = () => (
    <div className="card-elevated p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Reminders</p>
          <p className="text-base font-semibold text-secondary">Smart notifications</p>
        </div>
        <Bell className="w-5 h-5 text-primary" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={enableReminders}>
          Enable alerts
        </Button>
        <Button size="sm" variant="outline" onClick={cancelAll}>
          Stop for today
        </Button>
        <Button size="sm" onClick={sendMissedDoseAlert}>
          Caregiver ping
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={downloadReport}>
          Download PDF
        </Button>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Keep this tab open for on-time browser alerts.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            aria-label={t.common.back}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          <h1 className="font-bold text-lg text-secondary">{t.dashboard.title}</h1>
          
          <Button 
            variant="ghost" 
            size="icon"
            aria-label={t.common.notifications}
          >
            <Bell className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container px-5 pt-6 lg:pt-8">
        <Tabs defaultValue="schedule" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger className="flex-1" value="schedule">Schedule</TabsTrigger>
            <TabsTrigger className="flex-1" value="assist">Assist</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <div className="space-y-6">
              {prescriptionImage && (
                <div className="card-elevated p-4 fade-up">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Uploaded Prescription</p>
                  <img src={prescriptionImage} alt="Uploaded prescription" className="w-full h-44 object-cover rounded-2xl" />
                </div>
              )}

              <div className="card-elevated p-5 flex flex-col gap-4 fade-up">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.dashboard.todaySchedule}</p>
                    <p className="font-semibold text-secondary">{today}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">{t.dashboard.dailyProgress}</span>
                    <span className="text-sm font-bold text-primary">1 {t.dashboard.of} 5 {t.dashboard.taken}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: "20%" }} />
                  </div>
                </div>
              </div>

              {typeof decipherText === 'string' && decipherText.length > 0 && (
                <div className="card-elevated p-5 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">AI Decipher</p>
                  <p className="text-base text-secondary leading-relaxed">{decipherText}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <TimeSection timeOfDay="morning" time="8:00 AM" medicines={sampleMedicines.morning} onSpeak={handleSpeak} onMarkTaken={handleMarkTaken} />
                <TimeSection timeOfDay="afternoon" time="1:00 PM" medicines={sampleMedicines.afternoon} onSpeak={handleSpeak} onMarkTaken={handleMarkTaken} />
              </div>

              <TimeSection timeOfDay="night" time="9:00 PM" medicines={sampleMedicines.night} onSpeak={handleSpeak} onMarkTaken={handleMarkTaken} />
            </div>
          </TabsContent>

          <TabsContent value="assist" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Left Column - Reminders & WhatsApp */}
              <div className="space-y-4 lg:col-span-1">
                <ReminderCard />
                
                {/* WhatsApp Card - Premium Styled */}
                <div className="card-elevated p-5 space-y-4 bg-gradient-to-br from-white/50 to-white/30 border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-secondary">WhatsApp Alert</p>
                      <p className="text-xs text-muted-foreground">Notify your caregiver</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-2 block">Caregiver Number</label>
                      <Input 
                        value={waPhone} 
                        onChange={(e) => setWaPhone(e.target.value)} 
                        placeholder="e.g. +9198xxxxxxx"
                        className="h-10 border-green-200 focus-visible:ring-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-2 block">Custom Message</label>
                      <textarea 
                        value={waMsg} 
                        onChange={(e) => setWaMsg(e.target.value)} 
                        placeholder="Your message here..." 
                        className="flex min-h-[80px] w-full rounded-md border border-green-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                      <Checkbox 
                        id="save-caregiver" 
                        checked={saveCaregiver} 
                        onCheckedChange={(checked) => setSaveCaregiver(!!checked)} 
                      />
                      <label htmlFor="save-caregiver" className="text-xs text-muted-foreground cursor-pointer">
                        Save this number for future use
                      </label>
                    </div>
                    
                    <Button 
                      onClick={openWhatsApp}
                      className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send via WhatsApp
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Auto-includes medicine details</p>
                  </div>
                </div>
              </div>

              {/* Middle Column - Pharmacy & Hospital */}
              <div className="space-y-4 lg:col-span-1">
                <PharmacyFinder />
                <HospitalFinder />
                <PriceComparison />
              </div>

              {/* Right Column - Chatbots */}
              <div className="space-y-4 lg:col-span-1">
                <div className="card-elevated p-5 border border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-secondary">Health Assistant</p>
                      <p className="text-xs text-muted-foreground">Ask any health question</p>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="basic" className="text-xs">Quick Guidance</TabsTrigger>
                      <TabsTrigger value="advanced" className="text-xs">Personalized</TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic" className="space-y-3">
                      <Chatbot />
                    </TabsContent>
                    <TabsContent value="advanced" className="space-y-3">
                      <AdvancedChatbot />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DashboardView;
