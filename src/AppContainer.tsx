import { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import ChatbotWireframe from './ChatbotWireframe';
import ChatHistory from './ChatHistory';
import Settings from './Settings';
import { useIsMobile } from './components/ui/use-mobile';
import { Toaster } from './components/ui/sonner';
import type { User, AppState } from './types';

export default function AppContainer() {
  const [user, setUser] = useState<User | null>(null);
  const [currentState, setCurrentState] = useState<AppState>('login');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [accentColor, setAccentColor] = useState('#f97316');
  const isMobile = useIsMobile();

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null;
    const savedAccentColor = localStorage.getItem('app-accent-color');
    const savedUser = localStorage.getItem('app-user');

    if (savedTheme) setTheme(savedTheme);
    if (savedAccentColor) setAccentColor(savedAccentColor);
    if (savedUser) {
      try {
        const userData: User = JSON.parse(savedUser);
        setUser(userData);
        setCurrentState('chat');
        setCurrentChatId('new');
      } catch (error) {
        console.error('Error parsing saved user data:', error);
      }
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Save accent color
  useEffect(() => {
    localStorage.setItem('app-accent-color', accentColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

  // Auto-open history sidebar on desktop when logged in
  useEffect(() => {
    if (user && !isMobile && currentState === 'chat') {
      setIsHistoryOpen(true);
    }
  }, [user, isMobile, currentState]);

  const handleLogin = (userData: User) => {
    const userWithDefaults: User = {
      ...userData,
      botName: userData.botName || 'AI Assistant',
      avatar: userData.avatar || undefined,
    };
    setUser(userWithDefaults);
    localStorage.setItem('app-user', JSON.stringify(userWithDefaults));
    setCurrentState('chat');
    setCurrentChatId('new'); // Start with a new chat
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('app-user');
    setCurrentState('login');
    setCurrentChatId(null);
    setIsHistoryOpen(false);
  };

  const handleUpdateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('app-user', JSON.stringify(userData));
  };

  const handleOpenSettings = () => setCurrentState('settings');
  const handleBackFromSettings = () => setCurrentState('chat');

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setCurrentState('chat');
    if (isMobile) setIsHistoryOpen(false);
  };

  const handleNewChat = () => {
    setCurrentChatId('new');
    setCurrentState('chat');
    if (isMobile) setIsHistoryOpen(false);
  };

  const toggleHistory = () => {
    if (isMobile) {
      setCurrentState(currentState === 'history' ? 'chat' : 'history');
    } else {
      setIsHistoryOpen(!isHistoryOpen);
    }
  };

  const handleBackToChat = () => setCurrentState('chat');

  // Login state
  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  // Settings state
  if (currentState === 'settings') {
    return (
      <>
        <Settings
          user={user}
          theme={theme}
          accentColor={accentColor}
          onBack={handleBackFromSettings}
          onUpdateUser={handleUpdateUser}
          onUpdateTheme={setTheme}
          onUpdateAccentColor={setAccentColor}
        />
        <Toaster />
      </>
    );
  }

  // Mobile history state
  if (isMobile && currentState === 'history') {
    return (
      <>
        <div className="h-screen">
          <ChatHistory
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onClose={handleBackToChat}
            theme={theme}
            accentColor={accentColor}
          />
        </div>
        <Toaster />
      </>
    );
  }

  // Main chat interface
  return (
    <>
      <div className="h-screen flex">
        {/* Desktop sidebar */}
        {!isMobile && isHistoryOpen && (
          <div className="w-80 flex-shrink-0">
            <ChatHistory
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              onClose={() => setIsHistoryOpen(false)}
              theme={theme}
              accentColor={accentColor}
            />
          </div>
        )}

        {/* Main chat area */}
        <div className="flex-1 min-w-0">
          <ChatbotWireframe
            user={user}
            chatId={currentChatId}
            onToggleHistory={toggleHistory}
            onLogout={handleLogout}
            onOpenSettings={handleOpenSettings}
            isHistoryOpen={isHistoryOpen}
            isMobile={isMobile}
            theme={theme}
            accentColor={accentColor}
          />
        </div>
      </div>
      <Toaster />
    </>
  );
}
