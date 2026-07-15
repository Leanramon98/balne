'use client';

import { type ElementType, type ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/sdk/auth/AuthContext';
import { useDestino } from '@/context/destino-context';
import { cn } from '@/lib/utils';
import { getUserName, getUserRole, getUserRoles } from '@/lib/auth';
import { useTranslationOverrides } from '@/sdk/hooks/useTranslationOverrides';
import { mergeMessages } from '@/i18n/merge-overrides';
import { flatMessagesToNested } from '@/i18n/messages';
import {
  LayoutDashboard,
  ClipboardList,
  Zap,
  Map,
  TrendingUp,
  FileText,
  Settings,
  HelpCircle,
  Menu,
  X,
  Loader2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DtiLogo } from '@/components/atoms/DtiLogo';
import { NavSectionLabel } from '@/components/atoms/NavSectionLabel';
import { DestinoPill } from '@/components/molecules/DestinoPill';
import { UserProfilePill } from '@/components/molecules/UserProfilePill';
import { LanguageFlags } from '@/components/molecules/LanguageFlags';
import esMessages from '@/messages/es.json';
import ptMessages from '@/messages/pt.json';

interface NavItemDef {
  href: string;
  icon: ElementType;
  label: string;
  disabled?: boolean;
}

interface NavItemProps extends NavItemDef {
  title?: string;
  onClick?: () => void;
}

function NavItem({ href, icon: Icon, label, disabled, title, onClick }: NavItemProps) {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const isActive = !disabled && (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  // Reset loading state once navigation completes (pathname changes)
  useEffect(() => { setNavigating(false); }, [pathname]);

  const className = cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-[#040927] text-white'
      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  if (disabled) {
    return (
      <span className={className} aria-label={title} title={title}>
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      title={title}
      onClick={() => {
        setNavigating(true);
        onClick?.();
      }}
    >
      {navigating ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <Icon className="h-4 w-4 shrink-0" />
      )}
      {label}
    </Link>
  );
}

interface DtiShellProps {
  children: ReactNode;
}

function getLocaleFromCookie(): string {
  if (typeof window === 'undefined') return 'es';
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  return match?.[1] || 'es';
}

function DtiShellInner({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const st = useTranslations('shell');
  const { user } = useAuth();
  const router = useRouter();
  const userName = getUserName(user?.name || user?.email || 'Usuario');
  const userRole = getUserRole();
  const roles = getUserRoles();
  const isAdmin = roles.includes('admin') || roles.includes('superadmin');
  const isAdminDestino = roles.includes('admin_destino') && !isAdmin;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Backdrop overlay — mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — overlay on mobile, static on desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 flex flex-col bg-white transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header row: logo + close button (mobile) */}
        <div className="h-16 flex items-center justify-between bg-[#040927] px-3 border-b border-[#040927]">
          <button
            type="button"
            onClick={() => { router.push('/'); closeSidebar(); }}
            className="flex h-14 flex-1 cursor-pointer items-center justify-center rounded-md px-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label={st('ir-inicio')}
            title={st('ir-inicio')}
          >
            <DtiLogo className="flex w-full items-center justify-center" />
          </button>
          <button
            type="button"
            onClick={closeSidebar}
            className="lg:hidden flex items-center justify-center h-8 w-8 rounded-md text-white/70 hover:bg-white/10 hover:text-white shrink-0"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 scrollbar-dti">
          <nav className="px-3 py-4">
            <NavItem href="/" icon={LayoutDashboard} label={t('inicio')} onClick={closeSidebar} />
            <NavSectionLabel>{t('section-evaluar')}</NavSectionLabel>
            <NavItem href="/evaluaciones" icon={ClipboardList} label={t('evaluaciones')} onClick={closeSidebar} />

            <NavSectionLabel>{t('section-planificar')}</NavSectionLabel>
            <NavItem href="/acciones" icon={Zap} label={t('acciones')} onClick={closeSidebar} />
            <NavItem href="/plan-transformacion" icon={Map} label={t('plan')} onClick={closeSidebar} />
            <NavItem href="/buenas-practicas" icon={FileText} label={t('buenas-practicas')} onClick={closeSidebar} />

            <NavSectionLabel>{t('section-analizar')}</NavSectionLabel>
            <NavItem href="/resultados" icon={TrendingUp} label={t('resultados')} onClick={closeSidebar} />
            <NavItem href="/informes" icon={FileText} label={t('informes')} disabled={!isAdmin} onClick={closeSidebar} />

            <NavSectionLabel>{t('section-ayuda')}</NavSectionLabel>
            <NavItem href="/centro-de-ayuda" icon={HelpCircle} label={t('centro-de-ayuda')} onClick={closeSidebar} />
          </nav>
        </ScrollArea>

        {/* Admin section — fixed outside ScrollArea */}
        {isAdmin && (
          <div className="border-t border-zinc-200 px-3 py-3">
            <NavItem href="/configuracion" icon={Settings} label={t('configuracion')} onClick={closeSidebar} />
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 flex items-center justify-between gap-2 px-3 lg:px-6 bg-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-md text-zinc-500 hover:bg-zinc-100 shrink-0"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <DestinoPill />
            </div>
          </div>
          <div className="flex items-center gap-1 lg:gap-3 shrink-0">
            <span className="hidden lg:inline text-xs text-zinc-400 select-none">Idioma</span>
            <LanguageFlags />
            <UserProfilePill name={userName} role={userRole} />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-dti bg-[#fafafa]">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DtiShell({ children }: DtiShellProps) {
  const locale = getLocaleFromCookie();
  const baseMessages = locale === 'pt' ? ptMessages : esMessages;
  const { overrides } = useTranslationOverrides(locale);

  const currentMessages = flatMessagesToNested(mergeMessages(baseMessages, overrides, locale));

  return (
    <NextIntlClientProvider locale={locale} messages={currentMessages}>
      <DtiShellInner>{children}</DtiShellInner>
    </NextIntlClientProvider>
  );
}
