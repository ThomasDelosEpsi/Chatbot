import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Users, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card } from './components/ui/card';
import { useIsMobile } from './components/ui/use-mobile';
import type { User } from './types';
import { signIn, signUp } from './chatApi';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    botName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  // ⬇️ classes communes pour forcer les inputs en blanc uniquement sur cette page
  const inputBase =
    'h-12 rounded-2xl border border-gray-200 bg-white dark:bg-white ' +
    'text-gray-900 placeholder:text-gray-400 pl-10 pr-10 ' +
    'focus:border-orange-300 focus:ring-orange-200 shadow-none appearance-none';

  const handleInputChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);

      // (Optionnel) simple validation inscription
      if (!isLogin && formData.password !== formData.confirmPassword) {
        alert('Les mots de passe ne correspondent pas.');
        return;
      }

      if (isLogin) {
        // 🔐 Connexion Supabase
        const { user } = await signIn(formData.email, formData.password);
        if (user) {
          onLogin({
            email: user.email!,
            name: (user.user_metadata as any)?.name || user.email!,
            botName: formData.botName || 'Mon IA',
          });
        }
      } else {
        // 🆕 Inscription Supabase
        const { user } = await signUp(formData.email, formData.password, formData.name);
        if (user) {
          onLogin({
            email: user.email!,
            name: formData.name || user.email!,
            botName: formData.botName || 'Mon IA',
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ⬇️ Fond simple + colorScheme light uniquement pour cette page
    <div className="login-page min-h-screen grid place-items-center bg-white p-4" style={{ colorScheme: 'light' }}>
      <div className={`w-full max-w-md ${isMobile ? 'px-4' : ''}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-orange-500 shadow-lg shadow-orange-200/50">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to continue your AI conversations' : 'Join us to start your AI journey'}
          </p>
        </div>

        {/* Form */}
        <Card className="rounded-3xl border border-gray-200 bg-white dark:bg-white shadow-2xl overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      className={inputBase}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className={inputBase}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className={inputBase}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        className={inputBase}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">AI Assistant Name</label>
                    <div className="relative">
                      <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        value={formData.botName}
                        onChange={(e) => handleInputChange('botName', e.target.value)}
                        placeholder="AI Assistant (optional)"
                        className={inputBase}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Choose a name for your AI assistant</p>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            {isLogin && (
              <div className="mt-4 text-center">
                <button className="text-sm text-orange-600 transition-colors hover:text-orange-700">
                  Forgot your password?
                </button>
              </div>
            )}
          </div>

          <div className="border-t bg-gradient-to-r from-orange-50/50 to-blue-50/50 px-8 py-6">
            <p className="text-center text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => setIsLogin((v) => !v)}
                className="ml-2 font-medium text-orange-600 transition-colors hover:text-orange-700"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
