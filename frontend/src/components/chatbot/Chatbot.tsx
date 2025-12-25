import { useState, useCallback, useEffect } from 'react';
import ChatSidebar, { ChatHistory } from './ChatSidebar';
import ChatWindow, { Message } from './ChatWindow';
import ChatInput from './ChatInput';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string | null;
  autoStartVoice?: boolean;
}

const mockChatHistory: ChatHistory[] = [
  { id: '1', title: 'Aspirin Dosage Questions', timestamp: new Date(Date.now() - 86400000) },
  { id: '2', title: 'Drug Side Effects', timestamp: new Date(Date.now() - 172800000) },
  { id: '3', title: 'Medicine Interactions', timestamp: new Date(Date.now() - 259200000) },
];

const getMedicationResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('dosage') || lowerInput.includes('how much')) {
    return 'Always follow the dosage prescribed by your doctor or pharmacist. Typical dosages vary by medication:\n\n• Pain relievers (Aspirin, Ibuprofen): Usually 200-500mg per dose\n• Antibiotics: Follow specific prescription instructions\n• Blood pressure meds: Typically 1 tablet daily\n\nIf you\'re unsure about your specific medication, please consult your healthcare provider.';
  }

  if (lowerInput.includes('when') || lowerInput.includes('time') || lowerInput.includes('schedule')) {
    return 'Medication timing is important for effectiveness:\n\n• Morning medications: Take with breakfast\n• Afternoon medications: Take with lunch\n• Evening medications: Take before bed\n• Consistent times help maintain steady levels in your body\n\nSet reminders on your phone to help you remember. Never skip doses without consulting your doctor.';
  }

  if (lowerInput.includes('side effect') || lowerInput.includes('adverse')) {
    return 'Common side effects vary by medication. Examples include:\n\n• Mild nausea, dizziness, or headaches\n• Sleep disturbances\n• Stomach upset\n\n⚠️ Seek immediate medical attention if you experience:\n• Severe allergic reactions\n• Chest pain or difficulty breathing\n• Severe dizziness or fainting\n\nAlways read the information leaflet that comes with your medicine for a complete list.';
  }

  if (lowerInput.includes('food') || lowerInput.includes('eat') || lowerInput.includes('meal')) {
    return 'Food interactions with medications are important:\n\n• Some medicines should be taken with food to reduce stomach upset\n• Others need an empty stomach for better absorption\n• Dairy products can interfere with certain antibiotics\n• Grapefruit can affect many medications\n\nCheck your prescription label or ask your pharmacist specifically about your medication.';
  }

  if (lowerInput.includes('miss') || lowerInput.includes('forgot')) {
    return 'If you miss a dose:\n\n1. Take it as soon as you remember\n2. If it\'s close to your next scheduled dose, skip the missed dose\n3. Never double up on doses\n4. Set reminders to avoid missing doses in the future\n\nFor specific guidance on your medication, consult your pharmacist or doctor.';
  }

  if (lowerInput.includes('interaction') || lowerInput.includes('together')) {
    return 'Drug interactions can be serious:\n\n• Some medications don\'t work well together\n• They can increase side effects\n• Always inform your doctor about ALL medications you\'re taking, including OTC drugs and supplements\n\nYour pharmacist can screen for interactions when you pick up your prescription. Don\'t hesitate to ask questions!';
  }

  if (lowerInput.includes('pregnant') || lowerInput.includes('breastfeeding')) {
    return 'Important: If you\'re pregnant or breastfeeding, inform your healthcare provider immediately.\n\n⚠️ Many medications are NOT safe during pregnancy or while breastfeeding. Your doctor needs to know so they can:\n• Adjust your current medications\n• Prescribe safer alternatives if needed\n\nNever stop or change medications without medical guidance, even if you\'re pregnant.';
  }

  if (lowerInput.includes('allerg')) {
    return 'If you\'re allergic to a medication:\n\n• Tell your doctor and pharmacist immediately\n• Inform them of all known drug allergies\n• Provide details of your reaction (rash, anaphylaxis, etc.)\n• They\'ll prescribe a safe alternative\n\nAlways wear a medical alert bracelet if you have serious allergies. Keep a list of your allergies with you.';
  }

  if (lowerInput.includes('pharmac') || lowerInput.includes('location')) {
    return 'Here are some nearby pharmacies based on your location:\n\n📍 **CVS Pharmacy**\n123 Main Street, 0.5 miles away\nOpen: 8 AM - 10 PM\nPhone: (555) 123-4567\n\n📍 **Walgreens**\n456 Oak Avenue, 0.8 miles away\nOpen: 7 AM - 11 PM\nPhone: (555) 234-5678\n\n📍 **Rite Aid**\n789 Elm Street, 1.2 miles away\nOpen: 9 AM - 9 PM\nPhone: (555) 345-6789\n\n💡 Tip: Call ahead to check if they have your medication in stock!';
  }

  return 'I\'m here to help with your medication questions!\n\nI can assist with:\n• Dosage and how much to take\n• When and how often to take your medicine\n• Food and drink interactions\n• Managing side effects\n• Missed dose instructions\n• Drug interactions\n• General medication safety\n• Finding nearby pharmacies\n\nPlease provide more details about your question, and I\'ll give you specific information. For serious concerns, always consult your doctor or pharmacist.';
};

const Chatbot = ({ isOpen, onClose, initialMessage, autoStartVoice }: ChatbotProps) => {
  const { user } = useAuth();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
  const [chats, setChats] = useState<Record<string, Message[]>>({
    default: [
      {
        id: '1',
        role: 'bot',
        content: 'Hello! I\'m your MediLingo Assistant. I\'m here to help answer your questions about medications, dosages, side effects, schedules, and other medication-related queries.\n\nHow can I help you today?',
      },
    ],
  });

  const [activeChat, setActiveChat] = useState('default');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>(mockChatHistory);
  const [isLoading, setIsLoading] = useState(false);

  const currentMessages = chats[activeChat] || [];

  // Handle initial message when chatbot opens
  useEffect(() => {
    if (isOpen && initialMessage) {
      // Automatically send the initial message
      handleSendMessage(initialMessage);
    }
  }, [isOpen, initialMessage]);

  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`;
    setChats((prev) => ({
      ...prev,
      [newId]: [
        {
          id: '1',
          role: 'bot',
          content: 'Hello! How can I help you with your medications today?',
        },
      ],
    }));
    setActiveChat(newId);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    if (chatId === 'default') return;
    setChats((prev) => {
      const newChats = { ...prev };
      delete newChats[chatId];
      return newChats;
    });
    setChatHistories((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChat === chatId) {
      setActiveChat('default');
    }
  };

  const handleSendMessage = useCallback(async (message: string) => {
    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
    };

    setChats((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), userMessage],
    }));

    setIsLoading(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/api/prescriptions/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user?.id, userMessage: message }),
      });

      let replyText = '';
      if (resp.ok) {
        const data = await resp.json();
        replyText = data?.reply || '';
      } else {
        // Fallback to local response if API returns error
        replyText = getMedicationResponse(message);
      }

      const botMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'bot',
        content: replyText || getMedicationResponse(message),
      };

      setChats((prev) => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), botMessage],
      }));

      // Update chat title if it's a new chat
      if (!chatHistories.find((c) => c.id === activeChat)) {
        const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        setChatHistories((prev) => [
          {
            id: activeChat,
            title,
            timestamp: new Date(),
          },
          ...prev,
        ]);
      }
    } catch (e) {
      const botMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'bot',
        content: getMedicationResponse(message),
      };
      setChats((prev) => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), botMessage],
      }));
    } finally {
      setIsLoading(false);
    }
  }, [activeChat, chatHistories]);

  const handleVoiceBlob = useCallback(async (blob: Blob) => {
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append('audio', blob, `voice-${Date.now()}.webm`);
      if (user?.id) form.append('userId', String(user.id));

      const resp = await fetch(`${API_BASE_URL}/api/voice/chat`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });

      if (!resp.ok) {
        throw new Error(`Voice chat failed: ${resp.status}`);
      }

      const data = await resp.json();
      const transcript: string = data?.transcript || 'Voice message';
      const replyText: string = data?.replyText || '';
      const audioB64: string | undefined = data?.replyAudioBase64;
      const audioMime: string | undefined = data?.replyAudioMimeType;

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: transcript,
      };

      const botMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'bot',
        content: replyText || getMedicationResponse(transcript),
      };

      setChats((prev) => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), userMessage, botMessage],
      }));

      // Play TTS if present
      if (audioB64 && audioMime) {
        try {
          const audio = new Audio(`data:${audioMime};base64,${audioB64}`);
          audio.play().catch(() => {});
        } catch {}
      }
    } catch (e) {
      const botMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'bot',
        content: 'Voice processing failed. Please try again or type your question.',
      };
      setChats((prev) => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), botMessage],
      }));
    } finally {
      setIsLoading(false);
    }
  }, [activeChat, API_BASE_URL, user?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full h-[90vh] max-w-6xl bg-white rounded-lg border border-gray-200 flex overflow-hidden">
        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Sidebar */}
        <ChatSidebar
          chats={chatHistories}
          activeChat={activeChat}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatWindow messages={currentMessages} />
          <ChatInput onSendMessage={handleSendMessage} onSendVoiceBlob={handleVoiceBlob} isLoading={isLoading} autoStartVoice={autoStartVoice} />
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
