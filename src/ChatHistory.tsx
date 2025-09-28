import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Search, MoreVertical, Trash2, Edit3, Archive, Clock } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card } from './components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { listConversations, getMessages } from './chatApi';
import { supabase } from './supabaseClient';

interface ChatItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatHistoryProps {
  onSelectChat: (chatId: string | null) => void;
  onNewChat: () => void;
  onClose?: () => void;
  className?: string;
  theme?: 'light' | 'dark';
  accentColor?: string;
  /** conversation actuellement ouverte pour griser/sélectionner */
  activeId?: string | null;
}

export default function ChatHistory({
  onSelectChat,
  onNewChat,
  onClose,
  className = '',
  theme = 'light',
  accentColor = '#f97316',
  activeId = null,
}: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  // ===== Load conversations from Supabase =====
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const convos = await listConversations(); // [{ id, title, created_at }]
        const items: ChatItem[] = await Promise.all(
          (convos || []).map(async (c: any) => {
            const msgs = await getMessages(c.id); // [{ role, content, created_at }]
            const messageCount = msgs.length;
            const last = msgs[msgs.length - 1];
            const lastMessage = last?.content ?? '';
            const ts = last?.created_at ?? c.created_at;
            return {
              id: c.id,
              title: c.title || 'New conversation',
              lastMessage,
              timestamp: ts ? new Date(ts) : new Date(),
              messageCount,
            } as ChatItem;
          })
        );

        items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setChats(items);
      } catch (e) {
        console.error('Failed to load conversations:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredChats = chats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // ===== Actions =====
  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    // Optimistic UI
    setDeleting((p) => ({ ...p, [chatId]: true }));
    const previous = chats;

    try {
      setChats((prev) => prev.filter((c) => c.id !== chatId));

      // 1) si votre schéma **n’a pas** de cascade FK: supprime d’abord messages
      const { error: msgErr } = await supabase.from('messages').delete().eq('conversation_id', chatId);
      if (msgErr && msgErr.code !== 'PGRST116') {
        // PGRST116 = table inexistante; on ignore si vous n’avez pas cette table exposée
        console.warn('delete messages returned:', msgErr.message);
      }

      // 2) supprime la conversation
      const { error } = await supabase.from('conversations').delete().eq('id', chatId);
      if (error) throw error;

      // si on vient de supprimer la conversation active → on vide la sélection
      if (activeId === chatId) onSelectChat(null);
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Unable to delete this conversation.');
      setChats(previous); // rollback
    } finally {
      setDeleting((p) => ({ ...p, [chatId]: false }));
    }
  };

  const handleArchiveChat = (chatId: string) => {
    // Optionnel: ajoute une colonne "archived" dans la table conversations
    console.log('Archive chat:', chatId);
  };

  const handleRenameChat = async (chatId: string) => {
    const current = chats.find((c) => c.id === chatId);
    const next = prompt('New title', current?.title || 'Conversation');
    if (next == null || next.trim() === '') return;
    try {
      const { error } = await supabase.from('conversations').update({ title: next.trim() }).eq('id', chatId);
      if (error) throw error;
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: next.trim() } : c)));
    } catch (e) {
      console.error('Rename failed:', e);
      alert('Unable to rename this conversation.');
    }
  };

  return (
    <div
      className={`h-full flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-orange-100/40 dark:border-gray-700/40 ${className}`}
    >
      {/* Header */}
      <div
        className="p-6 border-b border-orange-100/40 dark:border-gray-700/40"
        style={{
          background:
            theme === 'dark'
              ? `linear-gradient(to right, rgba(17, 24, 39, 0.8), ${accentColor}15)`
              : `linear-gradient(to right, rgba(255, 255, 255, 0.8), ${accentColor}15)`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat History</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-xl"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${accentColor}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              ×
            </Button>
          )}
        </div>

        {/* New Chat Button */}
        <Button
          onClick={onNewChat}
          className="w-full h-12 text-white rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mb-4"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            boxShadow: `0 10px 25px ${accentColor}30`,
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10 h-10 bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-600/50 rounded-xl transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            style={{ '--tw-ring-color': `${accentColor}40` } as React.CSSProperties}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `${accentColor}60`;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}20`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500 dark:text-gray-400">Loading conversations…</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No chats match your search' : 'No chat history yet'}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = activeId === chat.id;
            return (
              <Card
                key={chat.id}
                className={`p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] border-white/40 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm group ${isActive ? 'ring-2' : ''}`}
                onClick={() => onSelectChat(chat.id)}
                style={isActive ? { boxShadow: `0 0 0 2px ${accentColor}` } : undefined}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = `${accentColor}15`; }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    theme === 'dark' ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.6)';
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 flex-shrink-0" style={{ color: accentColor }} />
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{chat.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">{chat.lastMessage}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatTime(chat.timestamp)}
                      </div>
                      <span
                        className="px-2 py-1 rounded-full text-xs"
                        style={{ backgroundColor: `${accentColor}20`, color: `${accentColor}dd` }}
                      >
                        {chat.messageCount} messages
                      </span>
                    </div>
                  </div>

                  {/* Chat Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                        disabled={!!deleting[chat.id]}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${accentColor}20`; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => handleRenameChat(chat.id)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchiveChat(chat.id)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteChat(chat.id)}
                        className="text-destructive focus:text-destructive"
                        disabled={!!deleting[chat.id]}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleting[chat.id] ? 'Deleting…' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        className="p-4 border-t border-orange-100/40 dark:border-gray-700/40"
        style={{
          background:
            theme === 'dark'
              ? `linear-gradient(to right, rgba(17, 24, 39, 0.8), ${accentColor}10)`
              : `linear-gradient(to right, rgba(255, 255, 255, 0.8), ${accentColor}10)`,
        }}
      >
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
