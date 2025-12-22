import { MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'bot';
  content: string;
  isLoading?: boolean;
}

const ChatMessage = ({ role, content, isLoading }: ChatMessageProps) => {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "flex gap-4 py-4 px-6 group",
      isUser ? "justify-end bg-transparent" : "justify-start bg-slate-800/50"
    )}>
      {!isUser && (
        <div className="flex-shrink-0 flex items-start pt-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-500">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      <div className={cn(
        "max-w-2xl",
        isUser && "flex flex-col items-end"
      )}>
        <div className={cn(
          "px-4 py-3 rounded-lg max-w-2xl break-words",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-slate-700 text-slate-100 rounded-bl-none"
        )}>
          {isLoading ? (
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 flex items-start pt-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-600">
            <User className="w-5 h-5 text-slate-200" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
