'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/sdk/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mail, Lock, Compass, Users, Target, Globe, Eye, EyeOff } from 'lucide-react';

const LOCALES = ['es', 'pt'] as const;

function getLocaleFromCookie(): string {
  if (typeof window === 'undefined') return 'es';
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  return match?.[1] || 'es';
}

function setLocaleCookie(locale: string): void {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

const features = [
  { icon: Compass, titleKey: 'page.login.feature-autodiagnostico', descKey: 'page.login.feature-autodiagnostico-desc' },
  { icon: Users, titleKey: 'page.login.feature-colaborativa', descKey: 'page.login.feature-colaborativa-desc' },
  { icon: Target, titleKey: 'page.login.feature-plan', descKey: 'page.login.feature-plan-desc' },
];

export default function LoginPage() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const currentLocale = getLocaleFromCookie();

  useEffect(() => {
    const remembered = localStorage.getItem('remembered_email');
    if (remembered) {
      setEmail(remembered);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    if (remember && email) {
      localStorage.setItem('remembered_email', email);
    } else {
      localStorage.removeItem('remembered_email');
    }
  }, [remember, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.firstLogin) {
        router.push('/cambiar-contrasena');
      } else {
        router.push('/');
      }
    } catch {
      setError(t('page.login.invalid-credentials'));
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    setLocaleCookie(newLocale);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Language switch — top right */}
      <div className="absolute top-4 right-4 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 rounded-lg border-zinc-200 bg-white/80 backdrop-blur-sm"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-medium">{currentLocale === 'pt' ? 'Português' : 'Español'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-1 min-w-[140px]">
            {LOCALES.map((locale) => (
              <DropdownMenuItem
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`cursor-pointer px-3 py-2.5 ${
                  currentLocale === locale ? 'bg-blue-50 font-semibold text-blue-700' : ''
                }`}
              >
                {t(locale === 'es' ? 'page.login.espanol' : 'page.login.portugues')}
                {currentLocale === locale && <span className="ml-auto text-blue-600 text-xs">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] flex-col justify-between bg-[#040927] text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-white/5" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/5" />

        <div className="relative z-10 px-10 pt-10">
          <img src="/logo.webp" alt="My Application" className="block h-16 w-auto" />
        </div>

        <div className="relative z-10 px-10 flex-1 flex flex-col justify-center">
          <h2 className="text-4xl xl:text-5xl font-bold leading-[1.1] mb-6 text-white">
            {t('page.login.hero-title')}
          </h2>
          <p className="text-base leading-relaxed mb-12 text-white/80">
            {t('page.login.hero-desc')}
          </p>

          <div className="space-y-6 pl-2">
            {features.map((f) => (
              <div key={f.titleKey} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{t(f.titleKey)}</p>
                  <p className="text-sm text-white/70">{t(f.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-[#fafafa] px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-5 rounded-3xl border border-zinc-200 bg-white p-8 shadow-[0_24px_70px_rgba(4,9,39,0.08)]"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{t('page.login.title')}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{t('page.login.subtitle')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-zinc-700">{t('page.login.email-label')}</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('page.login.email-placeholder')}
                className="h-11 rounded-xl border-zinc-200 bg-zinc-50/60 pl-10 shadow-sm transition-colors focus-visible:bg-white focus-visible:ring-[#040927]"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-zinc-700">{t('page.login.password-label')}</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl border-zinc-200 bg-zinc-50/60 pl-10 pr-10 shadow-sm transition-colors focus-visible:bg-white focus-visible:ring-[#040927]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
                className="border-zinc-300 data-[state=checked]:border-[#040927] data-[state=checked]:bg-[#040927]"
              />
              <Label htmlFor="remember" className="text-sm text-zinc-600 font-normal cursor-pointer">
                {t('page.login.remember')}
              </Label>
            </div>
            <Link href="/recuperar" className="text-sm font-medium text-[#040927] hover:underline">
              {t('page.login.forgot-password')}
            </Link>
          </div>

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="relative h-11 w-full overflow-hidden rounded-xl bg-[#040927] font-semibold text-white shadow-lg shadow-[#040927]/20 hover:bg-[#101a4a] disabled:opacity-80"
          >
            {isLoading && (
              <>
                <span className="absolute inset-0 bg-white/20" />
                <span className="absolute top-0 left-0 h-full bg-white/30 animate-[loading-bar_1.5s_ease-in-out_infinite]" />
              </>
            )}
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('page.login.signing-in')}
                </>
              ) : (
                t('page.login.sign-in')
              )}
            </span>
          </Button>
          <style>{`
            @keyframes loading-bar {
              0% { width: 0%; left: 0; }
              50% { width: 100%; left: 0; }
              100% { width: 0%; left: 100%; }
            }
          `}</style>
        </form>
      </div>
    </div>
  );
}
