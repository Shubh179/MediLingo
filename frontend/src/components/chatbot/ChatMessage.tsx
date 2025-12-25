import { MessageCircle, User, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
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

const parseMarkdown = (text: string) => {
  // Replace **text** with <strong>text</strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Replace *text* with <em>text</em>
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Replace __text__ with <strong>text</strong>
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
  // Replace _text_ with <em>text</em>
  text = text.replace(/_(.*?)_/g, '<em>$1</em>');
  return text;
};

const ChatMessage = ({ role, content, isLoading, severity }: ChatMessageProps) => {
  const isUser = role === 'user';
  const parsedContent = parseMarkdown(content);

  return (
    <div className={cn(
      "flex gap-4 py-4 px-6 group",
      isUser ? "justify-end bg-transparent" : "justify-start bg-gray-50"
    )}>
      {!isUser && (
        <div className="flex-shrink-0 flex items-start pt-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary">
            <span className="text-white text-sm">💚</span>
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
            ? "bg-primary text-white rounded-br-none"
            : "bg-gray-100 text-gray-900 rounded-bl-none"
        )}>
          {isLoading ? (
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
            </div>
          ) : (
            <p 
              className="text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          )}
        </div>

        {/* Severity Badge */}
        {severity && !isUser && (
          <div className={cn(
            "mt-2 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2",
            severity.isEmergency
              ? "bg-red-100 text-red-700"
              : severity.level === 'High'
              ? "bg-orange-100 text-orange-700"
              : severity.level === 'Moderate'
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          )}>
            {severity.isEmergency && <AlertTriangle className="w-4 h-4" />}
            <span>🏥 {severity.disease} - Severity: {severity.score}/10 ({severity.level})</span>
          </div>
        )}
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
