import { useState, useRef, useEffect, memo } from 'react';
import { Send, Paperclip, Bot, Upload, Sparkles, Menu, History, LogOut, Settings, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card } from './components/ui/card';
import { useIsMobile } from './components/ui/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { sendMessage, getMessages } from './chatApi';

/* ---- Markdown renderer ---- */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

import type { Components } from 'react-markdown';

// helper à placer en haut du fichier (à côté des imports)
function normalizeMarkdown(raw: string) {
  let s = raw ?? "";
  if (s.includes("\\n")) s = s.replace(/\\n/g, "\n");
  const t = s.trim();
  if (t.startsWith("```") && t.endsWith("```")) {
    s = t.replace(/^```[^\n]*\n?/, "").replace(/```$/, "").trim();
  }
  const lines = s.split("\n");
  const nonEmpty = lines.filter((l) => l.trim() !== "");
  const mostlyIndented =
    nonEmpty.length > 0 &&
    nonEmpty.filter((l) => /^(\t| {4})/.test(l)).length >= Math.floor(nonEmpty.length * 0.8);
  if (mostlyIndented) s = lines.map((l) => l.replace(/^(\t| {4})/, "")).join("\n");
  return s;
}

/* ---- Components overrides (typés) ---- */
const markdownComponents: Components = {
  a: (props) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="underline" />
  ),
  code(props) {
    const { inline, className, children, ...rest } = props as {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
    };
    const base = inline
      ? 'px-1 py-0.5 rounded bg-black/20'
      : 'block p-3 rounded bg-black/30 overflow-x-auto';
    return (
      <code className={`${base} ${className || ''}`} {...rest}>
        {children}
      </code>
    );
  },
  img(props) {
    const p = props as any; // alt est optionnel → on simplifie
    return <img {...p} className="max-w-full rounded-lg" loading="lazy" />;
  },
};

interface Message {
  id: string | number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  hasAttachment?: boolean;
  attachmentName?: string;
}

interface User {
  email: string;
  name: string;
  avatar?: string;
  botName: string;
}

interface ChatbotWireframeProps {
  user: User;
  chatId: string | null;
  onToggleHistory: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  isHistoryOpen: boolean;
  isMobile: boolean;
  theme: 'light' | 'dark';
  accentColor: string;
}

/* ---------- Input composant ---------- */
type LiquidGlassInputProps = {
  inputValue: string;
  setInputValue: (v: string) => void;
  isInputFocused: boolean;
  setIsInputFocused: (v: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleInputSubmit: (e?: React.FormEvent) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  accentColor: string;
};

const LiquidGlassInput = memo(function LiquidGlassInput({
  inputValue,
  setInputValue,
  isInputFocused,
  setIsInputFocused,
  handleKeyDown,
  handleInputSubmit,
  handleFileUpload,
  fileInputRef,
  accentColor,
}: LiquidGlassInputProps) {
  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 backdrop-blur-2xl rounded-3xl border transition-all duration-500 ease-out ${isInputFocused
          ? 'bg-gradient-to-r from-white/95 via-white/80 to-white/95 dark:from-gray-800/95 dark:via-gray-700/80 dark:to-gray-800/95 shadow-2xl'
          : 'bg-gradient-to-r from-white/85 via-white/70 to-white/85 dark:from-gray-800/85 dark:via-gray-700/70 dark:to-gray-800/85 border-white/30 dark:border-gray-600/30 shadow-xl'
          }`}
        style={
          isInputFocused
            ? { borderColor: `${accentColor}40`, boxShadow: `0 25px 50px ${accentColor}20` }
            : {}
        }
      >
        <div
          className={`absolute inset-0 rounded-3xl transition-all duration-700 ease-out ${isInputFocused ? 'opacity-40' : 'opacity-20'
            }`}
          style={{
            background: isInputFocused
              ? `linear-gradient(135deg, ${accentColor}30, transparent, ${accentColor}20)`
              : `linear-gradient(135deg, ${accentColor}15, transparent, ${accentColor}10)`,
          }}
        />
        <div
          className={`absolute inset-0 rounded-3xl transition-all duration-700 ease-out ${isInputFocused ? 'opacity-30' : 'opacity-15'
            }`}
          style={{
            background: isInputFocused
              ? `linear-gradient(225deg, ${accentColor}20, transparent, ${accentColor}30)`
              : `linear-gradient(225deg, ${accentColor}10, transparent, ${accentColor}15)`,
          }}
        />
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div
            className={`absolute w-2 h-2 rounded-full transition-all duration-1000 ${isInputFocused ? 'translate-x-8 translate-y-4 opacity-60' : 'translate-x-2 translate-y-8 opacity-30'
              }`}
            style={{ left: '20%', top: '30%', backgroundColor: `${accentColor}60` }}
          />
          <div
            className={`absolute w-1 h-1 rounded-full transition-all duration-1200 ${isInputFocused ? 'translate-x-6 translate-y-2 opacity-60' : 'translate-x-4 translate-y-6 opacity-30'
              }`}
            style={{ left: '70%', top: '60%', backgroundColor: `${accentColor}60` }}
          />
          <div
            className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-800 ${isInputFocused ? 'translate-x-4 translate-y-6 opacity-50' : 'translate-x-2 translate-y-3 opacity-30'
              }`}
            style={{ left: '80%', top: '20%', backgroundColor: `${accentColor}50` }}
          />
        </div>
      </div>

      <form onSubmit={handleInputSubmit} className="relative flex items-center gap-4 p-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className={`h-11 w-11 p-0 rounded-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 ${isInputFocused
                  ? 'hover:bg-white/60 dark:hover:bg-gray-700/60'
                  : 'hover:bg-white/60 dark:hover:bg-gray-700/60 text-gray-600 dark:text-gray-400'
                  }`}
                style={isInputFocused ? { color: accentColor } : {}}
              >
                <Paperclip className="h-5 w-5 transition-all duration-300" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700">
              <p>Attach file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex-1 relative">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Type your message..."
            className={`bg-transparent border-none shadow-none focus-visible:ring-0 pr-12 transition-all duration-300 ${isInputFocused ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-white'
              } placeholder:text-gray-500 dark:placeholder:text-gray-400`}
          />

          <div
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-500 ${isInputFocused || inputValue ? 'opacity-100 scale-100' : 'opacity-60 scale-90'
              }`}
          >
            {isInputFocused || inputValue ? (
              <Zap className="h-4 w-4 transition-all duration-300" style={{ color: isInputFocused ? accentColor : `${accentColor}aa` }} />
            ) : (
              <Sparkles className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={!inputValue.trim()}
          size="sm"
          className={`h-11 w-11 p-0 rounded-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 disabled:scale-100 disabled:opacity-50 ${!inputValue.trim() ? 'bg-gradient-to-r from-gray-300 to-gray-400 cursor-not-allowed' : ''
            }`}
          style={
            inputValue.trim()
              ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, boxShadow: `0 10px 25px ${accentColor}40` }
              : {}
          }
        >
          <Send className={`h-4 w-4 transition-all duration-200 ${inputValue.trim() ? 'text-white' : 'text-gray-500'}`} />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />
      </form>
    </div>
  );
});

/* --------------------------------------------------------------------- */

export default function ChatbotWireframe({
  user,
  chatId,
  onToggleHistory,
  onLogout,
  onOpenSettings,
  isHistoryOpen,
  isMobile,
  theme,
  accentColor,
}: ChatbotWireframeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(chatId && chatId !== 'new' ? chatId : null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageAnimations, setMessageAnimations] = useState<Record<string | number, boolean>>({});

  const isMobileHook = useIsMobile();

  // ----------- Nouveau : gestion du scroll "inversé" -----------
const messagesRef = useRef<HTMLDivElement>(null);
const [nearTop, setNearTop] = useState(true);

const onScrollMessages = () => {
  const el = messagesRef.current;
  if (!el) return;
  setNearTop(el.scrollTop <= 24); // proche du haut
};

useEffect(() => {
  const el = messagesRef.current;
  if (!el) return;
  if (nearTop) el.scrollTo({ top: 0, behavior: 'smooth' });
}, [messages, nearTop]);

  useEffect(() => {
    setMessageAnimations({});
    if (!chatId || chatId === 'new') {
      setConversationId(null);
      setMessages([]);
      return;
    }
    (async () => {
      try {
        const data = await getMessages(chatId);
        const msgs = (data || []).map((m: any) => ({
          id: m.id,
          content: m.content,
          sender: m.role === 'assistant' ? 'bot' : 'user',
          timestamp: new Date(m.created_at),
        })) as Message[];
        setConversationId(chatId);
        setMessages(msgs);
        msgs.forEach((m, i) =>
          setTimeout(() => setMessageAnimations((p) => ({ ...p, [m.id]: true })), i * 100)
        );
      } catch (e) {
        console.error('load messages failed:', e);
      }
    })();
  }, [chatId]);

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    const localId = `${Date.now()}-u`;
    const userMsg: Message = { id: localId, content: text, sender: 'user', timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => setMessageAnimations((p) => ({ ...p, [localId]: true })), 60);

    try {
      const res = await sendMessage(text, conversationId || undefined);
      if (!conversationId) setConversationId(res.conversationId);

      const bot = res.message;
      const botId = bot.id;
      const botMsg: Message = {
        id: botId,
        content: bot.content,
        sender: 'bot',
        timestamp: new Date(bot.created_at),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTimeout(() => setMessageAnimations((p) => ({ ...p, [botId]: true })), 120);
    } catch (e: any) {
      console.error('invoke failed:', e?.message || e);
      const errId = `${Date.now()}-err`;
      setMessages((prev) => [
        ...prev,
        {
          id: errId,
          content:
            "Désolé, je n'arrive pas à joindre le serveur pour l'instant.\nVérifie l'URL du webhook n8n et les logs de la Function.",
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
      setTimeout(() => setMessageAnimations((p) => ({ ...p, [errId]: true })), 120);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSendMessage();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newMessage: Message = {
        id: `${Date.now()}-file`,
        content: `Uploaded file: ${file.name}`,
        sender: 'user',
        timestamp: new Date(),
        hasAttachment: true,
        attachmentName: file.name,
      };
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => setMessageAnimations((p) => ({ ...p, [newMessage.id]: true })), 100);
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <TooltipProvider>
      <div className="h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col relative overflow-hidden">
        {/* background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-96 h-96 rounded-full blur-3xl -top-48 -right-48 animate-pulse opacity-20"
            style={{ background: `linear-gradient(135deg, ${accentColor}40, transparent)` }}
          />
          <div
            className="absolute w-80 h-80 rounded-full blur-3xl -bottom-40 -left-40 animate-pulse opacity-20"
            style={{ background: `linear-gradient(135deg, transparent, ${accentColor}30)`, animationDelay: '2s' }}
          />
        </div>

        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-orange-100/40 dark:border-gray-700/40 sticky top-0 z-10 relative">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleHistory}
                    className="h-10 w-10 p-0 rounded-xl mr-2"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${accentColor}20`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </Button>
                )}

                <div className="relative cursor-pointer" onClick={isMobile ? onToggleHistory : undefined}>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, boxShadow: `0 10px 25px ${accentColor}30` }}
                  >
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900 dark:text-white text-lg">{user.botName}</h1>
                  <p className="text-sm flex items-center gap-1" style={{ color: `${accentColor}cc` }}>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Online • Ready to help
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isMobile && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleHistory}
                        className={`h-10 w-10 p-0 rounded-xl transition-all duration-200 ${isHistoryOpen ? `text-white dark:text-white` : 'hover:bg-orange-50 dark:hover:bg-gray-800'
                          }`}
                        style={isHistoryOpen ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` } : {}}
                      >
                        <History className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isHistoryOpen ? 'Hide' : 'Show'} chat history</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 rounded-xl"
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${accentColor}20`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-white text-sm" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}>
                          {user.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onOpenSettings}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={messagesRef}
          onScroll={onScrollMessages}
          className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6 relative"
        >
          {messages.length === 0 && !conversationId && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, boxShadow: `0 10px 25px ${accentColor}30` }}
                >
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Start a new conversation</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Ask me anything! I'm here to help with your questions and projects.</p>
                <div className="grid grid-cols-1 gap-3">
                  {['Help me design a mobile app', 'Explain a coding concept', 'Review my design ideas', 'Plan a project structure'].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInputValue(suggestion)}
                      className="p-3 text-left bg-white/80 dark:bg-gray-800/80 border rounded-xl transition-all duration-200 hover:scale-[1.02] text-sm text-gray-700 dark:text-gray-300"
                      style={{ borderColor: `${accentColor}30`, backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(255, 255, 255, 0.8)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${accentColor}15`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {[...messages].reverse().map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-4 transition-all duration-700 ease-out ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                } ${messageAnimations[message.id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              {message.sender === 'bot' && (
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, boxShadow: `0 10px 25px ${accentColor}30` }}
                >
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}

              <div className={`max-w-[70%] ${isMobile ? 'max-w-[85%]' : ''} transition-all duration-300 hover:scale-[1.02]`}>
                <Card
                  className={`p-5 transition-all duration-300 hover:shadow-lg ${message.sender === 'user'
                    ? 'text-white rounded-3xl rounded-br-lg'
                    : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-white/40 dark:border-gray-700/40 shadow-lg rounded-3xl rounded-bl-lg'
                    }`}
                  style={
                    message.sender === 'user'
                      ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, boxShadow: `0 10px 25px ${accentColor}30` }
                      : {}
                  }
                >
                  {message.hasAttachment && (
                    <div
                      className={`flex items-center gap-3 mb-3 p-3 rounded-2xl transition-all duration-200 ${message.sender === 'user' ? 'bg-white/20 hover:bg-white/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      style={message.sender !== 'user' ? { backgroundColor: `${accentColor}15` } : {}}
                    >
                      <Upload className={`h-4 w-4 ${message.sender === 'user' ? 'text-white/80' : ''}`} style={message.sender !== 'user' ? { color: accentColor } : {}} />
                      <span className={`text-sm font-medium ${message.sender === 'user' ? 'text-white' : ''}`} style={message.sender !== 'user' ? { color: `${accentColor}dd` } : {}}>
                        {message.attachmentName}
                      </span>
                    </div>
                  )}

                  {/* -------- Rendu Markdown -------- */}
                  <div
                    className={`prose max-w-none leading-relaxed prose-pre:!bg-transparent prose-code:!bg-transparent ${message.sender === 'user' ? 'prose-invert' : ''
                      }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeHighlight]}
                      components={markdownComponents as any} // cast pour éviter les chipotages TS
                    >
                      {normalizeMarkdown(message.content)}
                    </ReactMarkdown>
                  </div>
                </Card>
                <p className={`text-xs text-gray-500 dark:text-gray-400 mt-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>{formatTime(message.timestamp)}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-4 justify-start animate-fade-in">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, boxShadow: `0 10px 25px ${accentColor}30` }}
              >
                <Bot className="h-5 w-5 text-white" />
              </div>
              <Card className="p-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-white/40 dark:border-gray-700/40 shadow-lg rounded-3xl rounded-bl-lg">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: `${accentColor}dd` }} />
                  <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: `${accentColor}dd`, animationDelay: '0.15s' }} />
                  <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: `${accentColor}dd`, animationDelay: '0.3s' }} />
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-6 pt-4 relative">
          <LiquidGlassInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            isInputFocused={isInputFocused}
            setIsInputFocused={setIsInputFocused}
            handleKeyDown={handleKeyDown}
            handleInputSubmit={handleInputSubmit}
            handleFileUpload={handleFileUpload}
            fileInputRef={fileInputRef}
            accentColor={accentColor}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

/* Add custom animations once */
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }

  /* cacher la scrollbar mais laisser le scroll actif */
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;
document.head.appendChild(style);
