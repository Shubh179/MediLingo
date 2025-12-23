import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Clock, Plus, Trash2, ChevronUp, FileText, Download, Share2, MessageCircle, Brain, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMedicineHistory } from '@/contexts/MedicineHistoryContext';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { whatsappService } from '@/lib/whatsappService';
import { reminderService } from '@/lib/reminderService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface SimplePrescriptionPageProps {
  onBack: () => void;
  prescriptionText?: string | null;
  prescriptionImage?: string | null;
}

const SimplePrescriptionPage = ({ onBack, prescriptionText, prescriptionImage }: SimplePrescriptionPageProps) => {
  const { addMedicines, medicines } = useMedicineHistory();
  const { user } = useAuth();
  const { language } = useLanguage();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';

  const [extractedText] = useState<string | null>(prescriptionText || null);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [reminders, setReminders] = useState<any[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<any>(null);
  
  // Reminder form state
  const [reminderForm, setReminderForm] = useState({
    medicineName: '',
    dosage: '',
    times: ['08:00'],
    notes: '',
  });

  // Check for active alarms every minute
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const activeReminders = reminderService.getTodayReminders();
      for (const reminder of activeReminders) {
        if (reminder.times.includes(currentTime) && !activeAlarm) {
          setActiveAlarm(reminder);
          // Play alarm sound (you can add audio here)
          break;
        }
      }
    };

    const interval = setInterval(checkAlarms, 60000); // Check every minute
    checkAlarms(); // Check immediately on mount
    
    return () => clearInterval(interval);
  }, [activeAlarm]);

  const dismissAlarm = () => {
    setActiveAlarm(null);
  };

  const snoozeAlarm = () => {
    // Snooze for 5 minutes
    toast({
      title: "Alarm Snoozed",
      description: "Reminder will ring again in 5 minutes",
    });
    setActiveAlarm(null);
  };

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Load reminders on component mount
  useEffect(() => {
    const loadedReminders = reminderService.getReminders();
    setReminders(loadedReminders);
    
    // Request notification permission
    reminderService.requestNotificationPermission();
  }, []);

  // Auto-extract medicines when prescription text is provided
  useEffect(() => {
    if (prescriptionText && prescriptionText.trim()) {
      // Better medicine extraction logic
      const lines = prescriptionText.split('\n').filter(line => line.trim().length > 0);
      const medicineNames = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        // Skip common non-medicine lines
        if (trimmedLine.length > 2 && 
            !trimmedLine.toLowerCase().includes('prescription') &&
            !trimmedLine.toLowerCase().includes('doctor') &&
            !trimmedLine.toLowerCase().includes('patient') &&
            !trimmedLine.toLowerCase().includes('date') &&
            !trimmedLine.match(/^\d+[\.\)]/)) { // Skip numbered lists
          
          // Extract medicine name (usually the first part before dosage info)
          const medicineName = trimmedLine.split(/\s+(?:\d+|mg|ml|tablet|cap)/i)[0].trim();
          
          if (medicineName.length > 2) {
            medicineNames.push({
              id: `med_${Date.now()}_${medicineNames.length}`,
              name: medicineName,
              dosage: trimmedLine.includes('mg') || trimmedLine.includes('ml') ? 
                     trimmedLine.match(/\d+\s*(mg|ml|tablet|cap)/i)?.[0] || '' : '',
              instructions: trimmedLine
            });
          }
        }
        
        if (medicineNames.length >= 10) break; // Limit to 10 medicines
      }
      
      if (medicineNames.length > 0) {
        addMedicines(medicineNames);
        toast({
          title: 'Prescription Processed',
          description: `Found ${medicineNames.length} medicines`,
        });
      }

      // Save prescription to backend for the logged-in user
      (async () => {
        try {
          if (!user?.id) {
            console.warn('⚠️ User not logged in, skipping prescription save');
            return;
          }
          console.log('📤 Saving prescription for user:', user.id);
          const resp = await fetch(`${API_BASE_URL}/api/prescriptions/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              userId: user.id,
              rawOcrText: prescriptionText,
              targetLanguage: language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Marathi',
            }),
          });
          
          console.log('✅ Response status:', resp.status);
          
          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData?.message || `Server error: ${resp.status}`);
          }
          
          const data = await resp.json();
          console.log('✅ Backend response:', data);
          
          if (data?.success) {
            toast({ 
              title: 'Prescription saved!', 
              description: `Stored ${data.prescription?.medicinesCount || 0} medicines in your account.` 
            });
          }
        } catch (e) {
          console.error('❌ Save prescription error:', e);
          toast({
            title: 'Could not save prescription',
            description: e instanceof Error ? e.message : 'Server error while saving',
            variant: 'destructive',
          });
        }
      })();
    }
  }, [prescriptionText, addMedicines]);

  const downloadTextAsFile = () => {
    if (!prescriptionText) return;
    
    const element = document.createElement('a');
    const file = new Blob([prescriptionText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `prescription_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: 'File Downloaded',
      description: 'Prescription text saved successfully',
    });
  };

  const shareViaWhatsApp = () => {
    if (!whatsappPhone) {
      toast({
        title: 'Missing Phone Number',
        description: 'Please enter a WhatsApp phone number.',
        variant: 'destructive',
      });
      return;
    }

    const medicineList = medicines.map(m => `• ${m.name}${m.dosage ? ` - ${m.dosage}` : ''}`).join('\n');
    const message = `📋 *Prescription Summary*\n\n*Medicines:*\n${medicineList}\n\n*Full Text:*\n${prescriptionText}\n\n📱 Shared via MediLingo`;
    
    whatsappService.share({
      type: 'prescription',
      content: message,
      phoneNumber: whatsappPhone
    });
    
    setShowWhatsAppDialog(false);
    setWhatsappPhone('');
    
    toast({
      title: 'WhatsApp Opened',
      description: 'Share your prescription summary',
    });
  };

  // Add reminder
  const handleAddReminder = () => {
    if (!reminderForm.medicineName || !reminderForm.dosage) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in medicine name and dosage.',
        variant: 'destructive',
      });
      return;
    }

    const newReminder = reminderService.addReminder({
      medicineName: reminderForm.medicineName,
      dosage: reminderForm.dosage,
      times: reminderForm.times,
      frequency: 'daily' as const,
      startDate: new Date(),
      isActive: true,
      notes: reminderForm.notes,
    });

    setReminders(prev => [...prev, newReminder]);
    setShowReminderDialog(false);
    
    // Reset form
    setReminderForm({
      medicineName: '',
      dosage: '',
      times: ['08:00'],
      notes: '',
    });

    toast({
      title: 'Reminder Added',
      description: `Reminder set for ${reminderForm.medicineName}`,
    });
  };

  // Delete reminder
  const handleDeleteReminder = (reminderId: string) => {
    reminderService.deleteReminder(reminderId);
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    
    toast({
      title: 'Reminder Deleted',
      description: 'Reminder has been removed.',
    });
  };

  // Add time slot for reminders
  const addTimeSlot = () => {
    setReminderForm(prev => ({
      ...prev,
      times: [...prev.times, '12:00']
    }));
  };

  // Remove time slot
  const removeTimeSlot = (index: number) => {
    setReminderForm(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }));
  };

  // Update time slot
  const updateTimeSlot = (index: number, time: string) => {
    setReminderForm(prev => ({
      ...prev,
      times: prev.times.map((t, i) => i === index ? time : t)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="w-full px-0 md:px-2 py-6 relative z-10">
        {/* Header with premium styling */}
        <div className="flex items-center justify-between mb-8 fade-up">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-primary/10 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-black text-gray-900 gradient-text">Prescription Analysis</h1>
              <p className="text-sm text-gray-600">AI-powered medicine management</p>
            </div>
          </div>
          
          {/* Top Action Buttons with premium styling */}
          {prescriptionText && prescriptionText.trim() && !prescriptionText.includes('No text extracted') && !prescriptionText.includes('No clear text detected') && (
            <div className="flex items-center gap-3 fade-up" style={{ animationDelay: "0.2s" }}>
              <Button 
                onClick={downloadTextAsFile} 
                variant="outline" 
                size="sm"
                className="premium-shadow hover:scale-105 transition-all bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              <Button 
                onClick={() => setShowWhatsAppDialog(true)} 
                variant="outline" 
                size="sm"
                className="premium-shadow hover:scale-105 transition-all bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-400"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Prescription Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prescription Image with premium styling */}
            {prescriptionImage && (
              <Card className="fade-up glass-card premium-shadow hover:scale-[1.02] transition-all" style={{ animationDelay: "0.1s" }}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Uploaded Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <img 
                      src={prescriptionImage} 
                      alt="Prescription" 
                      className="max-w-sm h-auto object-contain rounded-xl border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all"
                      style={{ maxHeight: '300px', maxWidth: '300px' }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Extracted Text Display with premium styling */}
            <Card className="fade-up glass-card premium-shadow" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI Extracted Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prescriptionText && prescriptionText.trim() && !prescriptionText.includes('No text extracted') && !prescriptionText.includes('No clear text detected') ? (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg border" style={{ maxHeight: 'none', height: 'auto' }}>
                      <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800 leading-relaxed">
                        {prescriptionText}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Processing prescription image...</p>
                    <p className="text-sm text-gray-500">
                      {extractedText && extractedText.includes('No') ? 
                        'The image may be unclear or contain handwriting that is difficult to read.' :
                        'Please wait while we extract text from your prescription.'
                      }
                    </p>
                    {/* Show raw extracted text for debugging */}
                    {prescriptionText && (
                      <details className="mt-4 text-left">
                        <summary className="text-sm text-blue-600 cursor-pointer">Show raw extracted text</summary>
                        <div className="mt-2 p-3 bg-yellow-50 rounded text-xs font-mono text-gray-700 border">
                          {prescriptionText}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Medicine Management */}
          <div className="space-y-6">
            {/* Detected Medicines */}
            {medicines.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detected Medicines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3" style={{ maxHeight: 'none' }}>
                    {medicines.map((medicine) => (
                      <div key={medicine.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <h3 className="font-semibold text-blue-900">{medicine.name}</h3>
                        {medicine.dosage && (
                          <p className="text-sm text-blue-700 mt-1">Dosage: {medicine.dosage}</p>
                        )}
                        {medicine.instructions && (
                          <p className="text-xs text-blue-600 mt-1">{medicine.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medicine Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Medicine Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full mb-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Reminder
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Medicine Reminder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Medicine Name</Label>
                        <Input
                          value={reminderForm.medicineName}
                          onChange={(e) => setReminderForm(prev => ({ ...prev, medicineName: e.target.value }))}
                          placeholder="Enter medicine name"
                        />
                      </div>
                      
                      <div>
                        <Label>Dosage</Label>
                        <Input
                          value={reminderForm.dosage}
                          onChange={(e) => setReminderForm(prev => ({ ...prev, dosage: e.target.value }))}
                          placeholder="e.g., 1 tablet, 5ml"
                        />
                      </div>
                      
                      <div>
                        <Label>Reminder Times</Label>
                        {reminderForm.times.map((time, index) => (
                          <div key={index} className="flex gap-2 mt-2">
                            <Input
                              type="time"
                              value={time}
                              onChange={(e) => updateTimeSlot(index, e.target.value)}
                            />
                            {reminderForm.times.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeTimeSlot(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addTimeSlot}
                          className="mt-2"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Time
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Notes (Optional)</Label>
                        <Input
                          value={reminderForm.notes}
                          onChange={(e) => setReminderForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional notes"
                        />
                      </div>
                      
                      <Button onClick={handleAddReminder} className="w-full">
                        <Bell className="w-4 h-4 mr-2" />
                        Add Reminder
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Active Reminders */}
                {reminders.length > 0 && (
                  <div className="space-y-2" style={{ maxHeight: 'none' }}>
                    {reminders.map((reminder) => (
                      <div key={reminder.id} className="flex items-center justify-between p-3 bg-green-50 rounded border-l-4 border-green-400">
                        <div>
                          <p className="font-medium text-sm text-green-900">{reminder.medicineName}</p>
                          <p className="text-xs text-green-700">{reminder.dosage}</p>
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {reminder.times.join(', ')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReminder(reminder.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* WhatsApp Dialog */}
        <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                Share via WhatsApp
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>WhatsApp Phone Number (with country code)</Label>
                <Input
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="e.g., +1234567890"
                />
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-medium">Preview:</p>
                <p className="text-xs text-green-700 mt-1">
                  📋 Prescription Summary with {medicines.length} medicines and extracted text
                </p>
              </div>
              <Button onClick={shareViaWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
                <Share2 className="w-4 h-4 mr-2" />
                Send to WhatsApp
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/90"
            size="sm"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
        )}

        {/* Alarm Notification UI */}
        {activeAlarm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-pulse">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-t-2xl text-white text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-white/20 rounded-full p-4 animate-bounce">
                    <Volume2 className="w-8 h-8" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Medicine Reminder!</h2>
                <p className="text-lg opacity-90">Time to take your medicine</p>
              </div>
              
              <div className="p-6 text-center">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    💊 {activeAlarm.medicineName}
                  </h3>
                  <p className="text-lg text-gray-600 mb-2">
                    Dosage: {activeAlarm.dosage}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activeAlarm.notes && `Note: ${activeAlarm.notes}`}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={snoozeAlarm}
                    variant="outline"
                    className="flex-1 py-3 text-lg border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    Snooze 5min
                  </Button>
                  <Button
                    onClick={dismissAlarm}
                    className="flex-1 py-3 text-lg bg-green-600 hover:bg-green-700"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Taken
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplePrescriptionPage;
