import { Camera, Sparkles, MessageCircle, Upload, Video, MapPin, Building2, Ambulance, Droplets, Pill, CalendarCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import PrescriptionCard from "./PrescriptionCard";
import PrescriptionUpload from "./PrescriptionUpload";
import CameraCapture from "@/components/CameraCapture";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Chatbot from "@/components/chatbot/Chatbot";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import PharmacyFinder from "@/components/PharmacyFinder";
import { HospitalFinder } from "@/components/HospitalFinder";
import AmbulanceFinder from "@/components/AmbulanceFinder";
import BloodBankFinder from "@/components/BloodBankFinder";
import JanAushadhiFinder from "@/components/JanAushadhiFinder";
import BookAppointment from "@/components/BookAppointment";
import MedicineDelivery from "@/components/MedicineDelivery";
import ActionSidebar from "./ActionSidebar";
import DoctorChat from "@/components/DoctorChat";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMenstrualCycle } from "@/contexts/MenstrualCycleContext";

interface HeroSectionProps {
  onScanClick: () => void;
  onFileSelected?: (file: File) => void;
}

const HeroSection = ({ onScanClick, onFileSelected }: HeroSectionProps) => {
  const { t } = useLanguage();
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);
  const [showHospitalDialog, setShowHospitalDialog] = useState(false);
  const [showPharmacyDialog, setShowPharmacyDialog] = useState(false);
  const [showAmbulanceDialog, setShowAmbulanceDialog] = useState(false);
  const [showBloodBankDialog, setShowBloodBankDialog] = useState(false);
  const [showJanDialog, setShowJanDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [autoStartVoice, setAutoStartVoice] = useState(false);
  const [showDoctorChat, setShowDoctorChat] = useState(false);
  const { settings, status, updateSettings, syncToGoogleCalendar } = useMenstrualCycle();
  const [showCycleDialog, setShowCycleDialog] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    periodDuration: settings.periodDuration,
    cycleLength: settings.cycleLength,
    lastPeriodStart: settings.lastPeriodStart ? new Date(settings.lastPeriodStart) : null,
  });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setCycleForm({
      periodDuration: settings.periodDuration,
      cycleLength: settings.cycleLength,
      lastPeriodStart: settings.lastPeriodStart ? new Date(settings.lastPeriodStart) : null,
    });
  }, [settings]);

  const handleCycleSave = () => {
    if (!cycleForm.lastPeriodStart) {
      toast({
        title: "Choose start date",
        description: "Use the Google Calendar picker to anchor your cycle.",
        variant: "destructive",
      });
      return;
    }

    updateSettings({
      periodDuration: Number(cycleForm.periodDuration) || settings.periodDuration,
      cycleLength: Number(cycleForm.cycleLength) || settings.cycleLength,
      lastPeriodStart: cycleForm.lastPeriodStart.toISOString(),
    });
    setShowCycleDialog(false);
    toast({ title: "Cycle saved", description: "Countdown refreshed and ready to sync." });
  };

  const handleGoogleSync = () => {
    const url = syncToGoogleCalendar();
    if (!url) {
      toast({
        title: "Add your cycle first",
        description: "Save last period start to generate the calendar event.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Google Calendar", description: "Opening your recurring event in a new tab." });
  };

  const ensureLoggedIn = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to use the chatbot.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleScanClick = () => {
    setShowScanOptions(true);
  };

  const handleCameraClick = () => {
    setShowScanOptions(false);
    setShowCamera(true);
  };

  const handleGalleryClick = () => {
    setShowScanOptions(false);
    // Trigger gallery upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Pass the file to the parent component for OCR processing
        onFileSelected?.(file);
        onScanClick();
      }
    };
    input.click();
  };

  const handleChat = () => {
    if (!ensureLoggedIn()) return;
    setChatInitialMessage(null);
    setShowChatbot(true);
  };

  const openHospitalFinder = () => {
    if (!ensureLoggedIn()) return;
    setShowHospitalDialog(true);
  };

  const openPharmacyFinder = () => {
    if (!ensureLoggedIn()) return;
    setShowPharmacyDialog(true);
  };

  const openAmbulanceFinder = () => {
    setShowAmbulanceDialog(true);
  };

  const openBloodBankFinder = () => {
    setShowBloodBankDialog(true);
  };

  const openJanAushadhiFinder = () => {
    setShowJanDialog(true);
  };

  const openAppointmentDialog = () => {
    if (!ensureLoggedIn()) return;
    setShowAppointmentDialog(true);
  };

  const openDeliveryDialog = () => {
    if (!ensureLoggedIn()) return;
    setShowDeliveryDialog(true);
  };

  return (
    <section className="min-h-[calc(100svh-4rem)] md:min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 px-5 pb-[env(safe-area-inset-bottom)] flex flex-col relative overflow-hidden">
            {/* Left Collapsible Action Sidebar */}
            <ActionSidebar
              onAmbulance={openAmbulanceFinder}
              onBloodBank={openBloodBankFinder}
              onJanAushadhi={openJanAushadhiFinder}
              onScanPrescription={handleScanClick}
              onNearbyHospitals={openHospitalFinder}
              onNearbyPharmacies={openPharmacyFinder}
              onBookAppointment={openAppointmentDialog}
              onMedicineDelivery={openDeliveryDialog}
            />
      {/* Grid background - entire page */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none z-0" style={{
        backgroundImage: `linear-gradient(to right, rgba(16, 185, 129, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.3) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Menstrual Cycle Tracker - Top Right (moved down 35%) */}
      <div className="absolute top-16 right-5 z-20 fade-up max-w-sm" style={{ animationDelay: "0.1s" }}>
        <div className="card-elevated border border-primary/30 bg-primary/5 p-4 md:p-5 rounded-3xl flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Menstrual Cycle Tracker</p>
              <h3 className="text-lg font-bold text-foreground leading-tight">{status.countdownLabel}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {status.nextPeriodStart
                  ? `Next window starts ${status.nextPeriodStart.toLocaleDateString()}${status.nextPeriodEnd ? ` • ends ${status.nextPeriodEnd.toLocaleDateString()}` : ""}`
                  : "Save your cycle to start live countdowns."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/80">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-primary/20 shadow-sm">
              <CalendarCheck className="w-3.5 h-3.5 text-primary" />
              <span>{status.isDelayed ? "Delayed" : "On track"}</span>
            </div>
            {settings.lastPeriodStart && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-border/80 text-muted-foreground">
                <Droplets className="w-3.5 h-3.5 text-rose-500" />
                {new Date(settings.lastPeriodStart).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setShowCycleDialog(true)}
              className="rounded-full bg-primary hover:bg-primary/90 text-white px-4 py-2 h-auto text-sm w-full"
            >
              Add Menstrual Cycle
            </Button>
            <Button
              className="rounded-full bg-secondary hover:bg-secondary/90 text-white px-4 py-2 h-auto text-sm w-full"
              onClick={handleGoogleSync}
              disabled={!status.nextPeriodStart}
            >
              Sync with Google Calendar
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-4 md:pt-6 pb-4 max-w-4xl mx-auto w-full">
        {/* Prescription Upload Component */}
        <div className="w-full mb-4 fade-up" style={{ animationDelay: "0.1s" }}>
          <PrescriptionUpload 
            onCameraClick={handleCameraClick}
            onUploadClick={handleGalleryClick}
          />
        </div>

        {/* Removed emergency quick access buttons; available in sidebar */}

        {/* Chat Input Box */}
        <div className="w-full max-w-2xl mx-auto mb-3 fade-up" style={{ animationDelay: "0.18s" }}>
          <div 
            onClick={() => {
              if (!ensureLoggedIn()) return;
              setChatInitialMessage(null);
              setShowChatbot(true);
            }}
            className="flex items-center gap-3 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-full cursor-text hover:border-primary/40 transition-all"
          >
            <MessageCircle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm flex-1">{t.hero.chatPlaceholder}</span>
            {/* Voice emoji button that opens chat */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!ensureLoggedIn()) return;
                setChatInitialMessage(null);
                setAutoStartVoice(true);
                setShowChatbot(true);
              }}
              aria-label="Voice chat"
              className="ml-auto inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-base hover:scale-110 transition-transform"
            >
              <span role="img" aria-label="microphone">🎤</span>
            </button>
          </div>
        </div>

        {/* Consult a Doctor Button */}
        <div className="w-full max-w-2xl mx-auto mb-3 fade-up" style={{ animationDelay: "0.19s" }}>
          <Button
            onClick={() => setShowDoctorChat(true)}
            className="w-full flex items-center gap-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full py-3 px-6 text-lg font-semibold shadow-md"
          >
            <img src="https://cdn-icons-png.flaticon.com/512/387/387561.png" alt="Doctor" className="w-7 h-7 rounded-full border-2 border-white bg-white mr-2" />
            Consult a Doctor
          </Button>
        </div>

        <DoctorChat isOpen={showDoctorChat} onClose={() => setShowDoctorChat(false)} />

        {/* Removed quick action chips; available in sidebar */}
      </div>

      {/* Menstrual Cycle Dialog */}
      <Dialog open={showCycleDialog} onOpenChange={setShowCycleDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-rose-500" /> Add Menstrual Cycle
            </DialogTitle>
            <DialogDescription>
              Save your cycle settings, pick the last period start with the Google Calendar date picker, and sync recurring reminders.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="periodDuration">Period duration (days)</Label>
              <Input
                id="periodDuration"
                type="number"
                min={1}
                max={14}
                value={cycleForm.periodDuration}
                onChange={(e) => setCycleForm((prev) => ({ ...prev, periodDuration: Number(e.target.value) }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cycleLength">Cycle length (days)</Label>
              <Input
                id="cycleLength"
                type="number"
                min={15}
                max={60}
                value={cycleForm.cycleLength}
                onChange={(e) => setCycleForm((prev) => ({ ...prev, cycleLength: Number(e.target.value) }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Last period start (Google Calendar)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    {cycleForm.lastPeriodStart
                      ? cycleForm.lastPeriodStart.toLocaleDateString()
                      : "Choose date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={cycleForm.lastPeriodStart ?? undefined}
                    onSelect={(value) => setCycleForm((prev) => ({ ...prev, lastPeriodStart: value ?? prev.lastPeriodStart }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                We mirror this date into a Google Calendar recurring event when you sync.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setShowCycleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCycleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scan Options Dialog */}
      <Dialog open={showScanOptions} onOpenChange={setShowScanOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.hero.scanButton}</DialogTitle>
            <DialogDescription>
              {t.common.chooseUploadMethod}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 mt-4">
            <Button
              onClick={handleCameraClick}
              className="w-full h-16 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600 text-white font-semibold rounded-xl"
            >
              <Video className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">{t.common.useCamera}</div>
                <div className="text-xs opacity-90">{t.hero.takePhotoBtn}</div>
              </div>
            </Button>
            <Button
              onClick={handleGalleryClick}
              variant="outline"
              className="w-full h-16 border-2 border-primary hover:bg-primary/10 font-semibold rounded-xl"
            >
              <Upload className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">{t.common.uploadFromGallery}</div>
                <div className="text-xs opacity-75">{t.hero.uploadFileBtn}</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nearby Hospital Dialog */}
      <Dialog open={showHospitalDialog} onOpenChange={setShowHospitalDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t.nav.nearbyHospitals}</DialogTitle>
            <DialogDescription>
              {t.common.findNearby} {t.common.within1_5km}
            </DialogDescription>
          </DialogHeader>
          <HospitalFinder />
        </DialogContent>
      </Dialog>

      {/* Nearby Pharmacy Dialog */}
      <Dialog open={showPharmacyDialog} onOpenChange={setShowPharmacyDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t.nav.nearbyPharmacies}</DialogTitle>
            <DialogDescription>
              {t.common.findNearby} {t.common.within1_5km}
            </DialogDescription>
          </DialogHeader>
          <PharmacyFinder />
        </DialogContent>
      </Dialog>

      {/* Emergency Ambulance Dialog */}
      <Dialog open={showAmbulanceDialog} onOpenChange={setShowAmbulanceDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">🚑 Emergency Ambulance</DialogTitle>
            <DialogDescription>
              Call these numbers for immediate medical emergency
            </DialogDescription>
          </DialogHeader>
          <AmbulanceFinder />
        </DialogContent>
      </Dialog>

      {/* Blood Bank Dialog */}
      <Dialog open={showBloodBankDialog} onOpenChange={setShowBloodBankDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-rose-600">🩸 Find Blood Bank</DialogTitle>
            <DialogDescription>
              Call a nearby blood bank or use your location to find the closest option.
            </DialogDescription>
          </DialogHeader>
          <BloodBankFinder />
        </DialogContent>
      </Dialog>

      {/* Jan Aushadhi Dialog */}
      <Dialog open={showJanDialog} onOpenChange={setShowJanDialog}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-700">💊 Jan Aushadhi Finder</DialogTitle>
            <DialogDescription>
              Find low-cost generic alternatives and nearby Jan Aushadhi stores.
            </DialogDescription>
          </DialogHeader>
          <JanAushadhiFinder />
        </DialogContent>
      </Dialog>

      {/* Book Appointment Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-blue-700">📅 Book Doctor Appointment</DialogTitle>
            <DialogDescription>
              Schedule an appointment with a specialist at your preferred time.
            </DialogDescription>
          </DialogHeader>
          <BookAppointment />
        </DialogContent>
      </Dialog>

      {/* Medicine Delivery Dialog */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-emerald-700">🚚 Order Medicine Delivery</DialogTitle>
            <DialogDescription>
              Get medicines delivered to your doorstep in 1-2 hours.
            </DialogDescription>
          </DialogHeader>
          <MedicineDelivery />
        </DialogContent>
      </Dialog>

      {/* Chatbot Modal */}
      <Chatbot 
        isOpen={showChatbot} 
        onClose={() => {
          setShowChatbot(false);
          setChatInitialMessage(null);
          setAutoStartVoice(false);
        }} 
        initialMessage={chatInitialMessage}
        autoStartVoice={autoStartVoice}
        onAmbulanceClick={() => {
          setShowChatbot(false);
          setShowAmbulanceDialog(true);
        }}
      />

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={showCamera}
        onCapture={(file) => {
          onFileSelected?.(file);
          onScanClick();
        }}
        onClose={() => setShowCamera(false)}
      />
    </section>
  );
};

export default HeroSection;
