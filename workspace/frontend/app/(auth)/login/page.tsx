'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { Mail, Lock, Globe, Eye, EyeOff } from 'lucide-react';

const LOCALES = ['es', 'pt'] as const;

function getLocaleFromCookie(): string {
  if (typeof window === 'undefined') return 'es';
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  return match?.[1] || 'es';
}

function setLocaleCookie(locale: string): void {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

export default function LoginPage() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, loginLocalDemo } = useAuth();
  const localDemoEnabled = process.env.NEXT_PUBLIC_BALNE_LOCAL_DEMO_LOGIN === 'true'
    && process.env.NODE_ENV === 'development';

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
      if (localDemoEnabled && !email.trim() && !password) {
        await loginLocalDemo();
        router.push('/app');
        return;
      }
      const result = await login(email, password);
      if (result.firstLogin) {
        router.push('/cambiar-contrasena');
      } else {
        router.push('/app');
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fffaf0] px-5 py-5 text-[#174d4b] sm:px-8 sm:py-8 lg:px-12 lg:py-10">
      <div className="absolute -left-24 top-24 size-64 rounded-full bg-[#ffe17b]/70" aria-hidden="true" />
      <div className="absolute -bottom-28 right-[28%] size-72 rounded-full bg-[#d8f0e3]" aria-hidden="true" />

      <div className="absolute right-5 top-5 z-20 sm:right-8 sm:top-8 lg:right-12 lg:top-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 rounded-full border-[#174d4b]/20 bg-[#fffaf0]/90 px-4 text-[#174d4b] shadow-[0_4px_0_rgba(23,77,75,0.1)] backdrop-blur-sm hover:bg-[#ffe8a1]"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-medium">{currentLocale === 'pt' ? 'Português' : 'Español'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px] rounded-2xl border-[#174d4b]/15 bg-[#fffaf0] p-1 text-[#174d4b] shadow-[0_16px_35px_rgba(14,53,53,0.16)]">
            {LOCALES.map((locale) => (
              <DropdownMenuItem
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`cursor-pointer px-3 py-2.5 ${
                  currentLocale === locale ? 'bg-[#ffe8a1] font-semibold text-[#174d4b]' : ''
                }`}
              >
                {t(locale === 'es' ? 'page.login.espanol' : 'page.login.portugues')}
                {currentLocale === locale && <span className="ml-auto text-[#f0512d] text-xs">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <section className="relative z-10 flex w-full items-center justify-center py-16 lg:py-0">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-5 rounded-[2rem] border border-[#d9d1c3] bg-[#fffaf0] p-6 shadow-[0_18px_0_#edc889] sm:p-9"
        >
          <Image
            src="/brand/balne-logo.png"
            alt="Balne"
            width={3713}
            height={911}
            priority
            className="h-auto w-36 rounded-lg bg-[#fffaf0] p-1"
          />

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#dc4829]">Balne</p>
            <h1 className="mt-3 font-serif text-4xl font-black leading-none tracking-[-0.045em] text-[#174d4b]">{t('page.login.title')}</h1>
            <p className="mt-3 text-sm leading-6 text-[#586663]">{t('page.login.subtitle')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-[#174d4b]">{t('page.login.email-label')}</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6c7068]" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('page.login.email-placeholder')}
                className="h-12 rounded-2xl border-[#d9d1c3] bg-white pl-10 shadow-sm transition-colors focus-visible:border-[#174d4b] focus-visible:ring-[#174d4b]"
                required={!localDemoEnabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold text-[#174d4b]">{t('page.login.password-label')}</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6c7068]" aria-hidden="true" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-2xl border-[#d9d1c3] bg-white pl-10 pr-10 shadow-sm transition-colors focus-visible:border-[#174d4b] focus-visible:ring-[#174d4b]"
                required={!localDemoEnabled}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md text-[#6c7068] hover:text-[#174d4b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174d4b]"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
                className="border-[#8aa6a0] data-[state=checked]:border-[#174d4b] data-[state=checked]:bg-[#174d4b]"
              />
              <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-[#586663]">
                {t('page.login.remember')}
              </Label>
            </div>
            <Link href="/recuperar" className="text-sm font-bold text-[#174d4b] underline decoration-[#f0512d] decoration-2 underline-offset-4 hover:text-[#f0512d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174d4b]">
              {t('page.login.forgot-password')}
            </Link>
          </div>

          {error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {error}
            </p>
          )}

          {localDemoEnabled && (
            <p className="rounded-2xl border border-[#edc889] bg-[#fff4ca] px-3 py-2 text-center text-sm text-[#6f4c18]">
              DEMO LOCAL: dejá ambos campos vacíos para entrar con datos de muestra. No habilita acceso real.
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="relative h-12 w-full overflow-hidden rounded-full bg-[#f0512d] font-black text-white shadow-[0_5px_0_#b9341e] transition hover:-translate-y-0.5 hover:bg-[#ff5b36] focus-visible:ring-[#174d4b] disabled:translate-y-0 disabled:opacity-80"
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
            @media (prefers-reduced-motion: reduce) {
              .animate-spin, .animate-\\[loading-bar_1\\.5s_ease-in-out_infinite\\] { animation: none !important; }
            }
          `}</style>
        </form>
      </section>
    </main>
  );
}
