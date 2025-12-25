import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import ChatMessage from './ChatMessage';

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  isLoading?: boolean;
  severity?: {
    score: number;
    level: string;
    isEmergency: boolean;
    disease: string;
  };
}

interface ChatWindowProps {
  messages: Message[];
  onAmbulanceClick?: () => void;
}

const ChatWindow = ({ messages, onAmbulanceClick }: ChatWindowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Find the most recent emergency message
  const emergencyMessage = messages.find(m => m.severity?.isEmergency === true);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 w-full bg-white overflow-hidden">
      <div className="flex flex-col h-full">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <span className="text-3xl">💚</span>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                MediLingo Assistant
              </h2>
              <p className="text-gray-600 max-w-sm">
                Ask me anything about medications, dosages, schedules, side effects, or health-related questions.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                isLoading={message.isLoading}
                severity={message.severity}
              />
            ))}
            
            {/* Emergency Alert Banner */}
            {emergencyMessage && (
              <div className="mx-4 mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">
                      🚨 High Severity: {emergencyMessage.severity?.disease}
                    </h3>
                    <p className="text-sm text-red-800 mb-3">
                      Severity Score: {emergencyMessage.severity?.score}/10 ({emergencyMessage.severity?.level})
                    </p>
                    <p className="text-sm text-red-800 mb-4">
                      This condition requires immediate medical attention. Please seek emergency care or call an ambulance.
                    </p>
                    <button
                      onClick={onAmbulanceClick}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                    >
                      🚑 Call Ambulance
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

import { MessageCircle } from 'lucide-react';

export default ChatWindow;
