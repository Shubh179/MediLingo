import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  chats: ChatHistory[];
  activeChat: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

const ChatSidebar = ({
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}: ChatSidebarProps) => {
  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {chats.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No chat history yet
            </p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  activeChat === chat.id
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <button
                  onClick={() => onSelectChat(chat.id)}
                  className="flex-1 text-left truncate text-sm"
                  title={chat.title}
                >
                  {chat.title}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-slate-700 p-4 space-y-2 text-xs text-slate-500">
        <p>MediLingo Assistant v1.0</p>
        <p className="text-slate-600">© 2025. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ChatSidebar;
