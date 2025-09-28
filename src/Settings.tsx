import { useState, useRef } from 'react';
import { ArrowLeft, Upload, Palette, Moon, Sun, User, Bot, Camera, Trash2, Save } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card } from './components/ui/card';
import { Switch } from './components/ui/switch';
import { Label } from './components/ui/label';
import { Separator } from './components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { toast } from 'sonner';

interface SettingsProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    botName: string;
  };
  theme: 'light' | 'dark';
  accentColor: string;
  onBack: () => void;
  onUpdateUser: (userData: any) => void;
  onUpdateTheme: (theme: 'light' | 'dark') => void;
  onUpdateAccentColor: (color: string) => void;
}

const ACCENT_COLORS = [
  { name: 'Orange', value: '#f97316', gradient: 'from-orange-500 to-orange-600' },
  { name: 'Blue', value: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
  { name: 'Purple', value: '#8b5cf6', gradient: 'from-purple-500 to-purple-600' },
  { name: 'Green', value: '#10b981', gradient: 'from-green-500 to-green-600' },
  { name: 'Pink', value: '#ec4899', gradient: 'from-pink-500 to-pink-600' },
  { name: 'Indigo', value: '#6366f1', gradient: 'from-indigo-500 to-indigo-600' },
  { name: 'Red', value: '#ef4444', gradient: 'from-red-500 to-red-600' },
  { name: 'Teal', value: '#14b8a6', gradient: 'from-teal-500 to-teal-600' },
];

export default function Settings({ 
  user, 
  theme, 
  accentColor, 
  onBack, 
  onUpdateUser, 
  onUpdateTheme, 
  onUpdateAccentColor 
}: SettingsProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    botName: user.botName,
    avatar: user.avatar || ''
  });
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateUser({
      ...user,
      name: formData.name,
      botName: formData.botName,
      avatar: previewAvatar || formData.avatar
    });
    toast('Settings saved successfully!', {
      description: 'Your preferences have been updated.',
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setPreviewAvatar('');
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  const generateAvatar = () => {
    // Generate a simple geometric avatar
    const colors = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const initials = formData.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 200, 200);
      gradient.addColorStop(0, randomColor);
      gradient.addColorStop(1, randomColor + '80');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 200);
      
      // Add initials
      ctx.fillStyle = 'white';
      ctx.font = 'bold 80px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, 100, 100);
      
      setPreviewAvatar(canvas.toDataURL());
    }
  };

  const currentAvatar = previewAvatar || formData.avatar;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-orange-100/40 dark:border-gray-700/40 p-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-10 w-10 p-0 rounded-xl hover:bg-orange-50 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customize your AI assistant experience</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-white/40 dark:border-gray-700/40">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h3>
                
                {/* Avatar Section */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-gray-800 shadow-lg">
                      <AvatarImage src={currentAvatar} alt={formData.name} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xl">
                        {formData.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {currentAvatar && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeAvatar}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateAvatar}
                        className="h-9"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Generate Avatar
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Upload a photo or generate a custom avatar
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                {/* Name Field */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12 bg-white/80 dark:bg-gray-700/80 border-gray-200/50 dark:border-gray-600/50 rounded-xl"
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="h-12 bg-gray-100 dark:bg-gray-700 border-gray-200/50 dark:border-gray-600/50 rounded-xl opacity-60"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                </div>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance">
              <Card className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-white/40 dark:border-gray-700/40">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Appearance Settings</h3>
                
                {/* Theme Toggle */}
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <Label htmlFor="theme">Theme</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Choose between light and dark mode</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sun className="h-4 w-4 text-orange-500" />
                    <Switch
                      id="theme"
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => onUpdateTheme(checked ? 'dark' : 'light')}
                    />
                    <Moon className="h-4 w-4 text-blue-500" />
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Accent Color */}
                <div className="space-y-4">
                  <div>
                    <Label>Accent Color</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred accent color</p>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => onUpdateAccentColor(color.value)}
                        className={`relative h-12 rounded-xl bg-gradient-to-r ${color.gradient} transition-all duration-200 hover:scale-105 ${
                          accentColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-300' : ''
                        }`}
                      >
                        {accentColor === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-full shadow-lg"></div>
                          </div>
                        )}
                        <span className="sr-only">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Chatbot Tab */}
            <TabsContent value="chatbot">
              <Card className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-white/40 dark:border-gray-700/40">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Chatbot Settings</h3>
                
                {/* Bot Name */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor="botName">Assistant Name</Label>
                  <div className="relative">
                    <Bot className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="botName"
                      value={formData.botName}
                      onChange={(e) => setFormData(prev => ({ ...prev, botName: e.target.value }))}
                      placeholder="AI Assistant"
                      className="pl-10 h-12 bg-white/80 dark:bg-gray-700/80 border-gray-200/50 dark:border-gray-600/50 rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose a name for your AI assistant
                  </p>
                </div>

                {/* Preview */}
                <div className="space-y-3">
                  <Label>Preview</Label>
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-orange-50/30 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` 
                        }}
                      >
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{formData.botName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Online • Ready to help</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              className="h-12 px-8 bg-gradient-to-r hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` 
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}