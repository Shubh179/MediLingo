import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  isLoading?: boolean;
}

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow = ({ messages }: ChatWindowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

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
              />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

import { MessageCircle } from 'lucide-react';

export default ChatWindow;
