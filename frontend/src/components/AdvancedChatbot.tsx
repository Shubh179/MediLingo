import { useEffect, useState, useRef } from 'react';
import { BrainCircuit, Building2, Send, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMedicineHistory } from '@/contexts/MedicineHistoryContext';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface Hospital {
  name: string;
  lat: number;
  lon: number;
  distance?: number;
}

const AdvancedChatbot = ({ prescriptionText }: { prescriptionText?: string }) => {
  const { medicines, recordDose } = useMedicineHistory();
  const { user } = useAuth();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const findNearbyHospitals = async () => {
    if (!navigator.geolocation) {
      addBotMessage('Geolocation not available. Please enable location services.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const radius = 5000; // 5km radius
        
        const query = `
          [out:json];
          (
            node(around:${radius},${latitude},${longitude})[amenity=hospital];
            way(around:${radius},${latitude},${longitude})[amenity=hospital];
            node(around:${radius},${latitude},${longitude})[amenity=clinic];
            way(around:${radius},${latitude},${longitude})[amenity=clinic];
          );
          out center 10;
        `;

        try {
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
          });
          
          const data = await response.json();
          
          const hospitalList: Hospital[] = data.elements.map((el: any) => {
            const lat = el.lat || el.center?.lat || 0;
            const lon = el.lon || el.center?.lon || 0;
            const distance = calculateDistance(latitude, longitude, lat, lon);
            
            return {
              name: el.tags?.name || 'Unnamed Hospital',
              lat,
              lon,
              distance,
            };
          })
            .filter((h: Hospital) => h.distance && h.distance <= radius)
            .sort((a: Hospital, b: Hospital) => (a.distance || 0) - (b.distance || 0))
            .slice(0, 10);

          setNearbyHospitals(hospitalList);

          if (hospitalList.length > 0) {
            const hospitalInfo = hospitalList.map((h, idx) => 
              `${idx + 1}. ${h.name} - ${(h.distance! / 1000).toFixed(2)}km\n   📍 Maps: https://maps.google.com/?q=${h.lat},${h.lon}`
            ).join('\n\n');
            addBotMessage(`Found ${hospitalList.length} hospitals nearby:\n\n${hospitalInfo}`);
          } else {
            addBotMessage('No hospitals found within 5km. Try enabling location services.');
          }
        } catch (err) {
          addBotMessage('Could not find hospitals. Please try again.');
          console.error(err);
        }
      },
      (err) => {
        addBotMessage('Please enable location services to find nearby hospitals.');
        console.error(err);
      }
    );
  };

  const addBotMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'bot',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText;
    addUserMessage(userMessage);
    setInputText('');
    setLoading(true);
    setError('');

    try {
      // Check for hospital search
      const lowerMessage = userMessage.toLowerCase();
      if (lowerMessage.includes('hospital') || lowerMessage.includes('clinic') || lowerMessage.includes('nearby')) {
        await findNearbyHospitals();
        setLoading(false);
        return;
      }
      // Prefer backend chatbot with medical history context
      try {
        const resp = await fetch(`${API_BASE_URL}/api/prescriptions/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: user?.id,
            userMessage,
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData?.error || errData?.message || 'Chat request failed');
        }
        const data = await resp.json();
        if (data?.reply) {
          addBotMessage(data.reply);
        } else {
          throw new Error('Empty chatbot response');
        }
      } catch (apiErr) {
        // Fallback to simple local rule-based response if backend fails
        let response = '';
        const medicineNames = medicines.map(m => m.name.toLowerCase());
        const mentionedMedicine = medicineNames.find(name => lowerMessage.includes(name));
        if (mentionedMedicine) {
          const medicine = medicines.find(m => m.name.toLowerCase() === mentionedMedicine);
          if (medicine) {
            if (lowerMessage.includes('when') || lowerMessage.includes('time')) {
              response = `Based on your history, ${medicine.name} is typically taken at ${medicine.timeOfDay}. Maintain consistency for best results.`;
            } else if (lowerMessage.includes('dose') || lowerMessage.includes('how much')) {
              response = `Your usual dose for ${medicine.name} is ${medicine.dosage}. Do not adjust without consulting your doctor.`;
            } else if (lowerMessage.includes('side effect')) {
              response = `For any side effects from ${medicine.name}, please consult your healthcare provider immediately.`;
            } else {
              response = `${medicine.name} - ${medicine.dosage}. ${medicine.instructions || 'Take as prescribed.'}`;
            }
          }
        } else if (lowerMessage.includes('miss') || lowerMessage.includes('forgot')) {
          response = 'If you missed a dose, take it as soon as you remember unless it\'s close to your next scheduled dose. Never double up. Consult your pharmacist for specific guidance.';
        } else if (lowerMessage.includes('schedule') || lowerMessage.includes('routine')) {
          response = `Your current routine includes ${medicines.length} medicine(s). Consistency is key - take them at the same times daily.`;
        } else if (lowerMessage.includes('side effect') || lowerMessage.includes('reaction')) {
          response = 'If you experience any unusual symptoms or side effects, contact your healthcare provider immediately. Don\'t stop medications without medical advice.';
        } else {
          response = `Based on your history with ${medicines.length} medicine(s), maintain your current schedule. For specific medical advice, please consult your healthcare provider.`;
        }
        addBotMessage(response);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMsg);
      addBotMessage(`Sorry, I encountered an error: ${errorMsg}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col border-0 shadow-lg bg-white/50 backdrop-blur-sm">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b">
          <BrainCircuit className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">AI Medicine Assistant</span>
          {medicines.length > 0 && (
            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {medicines.length} medicine{medicines.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 mb-4 border border-primary/20 rounded-lg bg-gradient-to-b from-white/80 to-white/50">
          <div className="space-y-3 p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-12">
                <p className="font-semibold mb-4 text-lg">👋 Hi! I'm your AI medicine assistant</p>
                <ul className="mt-4 space-y-2 text-xs">
                  <li>💊 Ask about your medicines & dosages</li>
                  <li>🏥 Find nearby hospitals & clinics</li>
                  <li>💬 Get personalized health advice</li>
                  <li>⏰ Track doses and schedules</li>
                </ul>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl text-sm break-words shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-secondary rounded-bl-none border border-border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <span className={`text-xs opacity-60 mt-1 block ${
                      msg.role === 'user' ? '' : ''
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-none border border-border">
                  <div className="flex gap-2 items-center">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {medicines.length > 0 && (
          <div className="grid grid-cols-1 gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                addUserMessage('Find nearby hospitals');
                findNearbyHospitals();
              }}
              className="text-xs w-full"
            >
              <Building2 className="w-3 h-3 mr-1" />
              Find Hospitals
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={medicines.length > 0 ? "💬 Ask me anything about your medicines..." : "📤 Upload prescription first..."}
              disabled={loading}
              className="text-sm h-10 bg-white/70 border border-primary/30 focus-visible:ring-primary"
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !inputText.trim()}
              size="sm"
              className="px-4 bg-primary hover:bg-primary/90"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center\">
            💡 Type your question above or press Enter
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedChatbot;
