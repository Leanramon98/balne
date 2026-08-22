'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/sdk/auth/AuthContext';
import { cn } from '@/lib/utils';
import { moduleRegistry } from '@/sdk/platform';
import {
  LayoutDashboard,
  ClipboardList,
  Zap,
  Map as MapIcon,
  TrendingUp,
  FileText,
  Settings,
  HelpCircle,
  User,
  Users,
  Menu,
  X,
  Loader2,
  LogOut,
  CalendarDays,
  Edit3,
  Layers,
  SquarePen,
  type LucideIcon,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Resolve a string icon name to a lucide-react component.
 * Add entries here as new modules contribute nav item icons.
 */
const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  clipboard: ClipboardList,
  zap: Zap,
  map: MapIcon,
  trending: TrendingUp,
  fileText: FileText,
  settings: Settings,
  helpCircle: HelpCircle,
  user: User,
  users: Users,
  calendar: CalendarDays,
  edit: Edit3,
  layers: Layers,
  squarePen: SquarePen,
};

function resolveIcon(iconName?: string): LucideIcon | null {
  if (!iconName) return null;
  return iconMap[iconName] ?? null;
}

interface NavItemProps {
  href: string;
  icon: LucideIcon | null;
  label: string;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}

function NavItem({ href, icon: Icon, label, disabled, title, onClick }: NavItemProps) {
  const pathname = usePathname();
  const isActive = !disabled && (href === '/app' ? pathname === '/app' : pathname?.startsWith(href));

  const className = cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    disabled && 'opacity-50 cursor-not-allowed',
  );

  if (disabled) {
    return (
      <span className={className} aria-label={title} title={title}>
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {!Icon && <span className="h-4 w-4 shrink-0" />}
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      title={title}
      onClick={onClick}
    >
      {Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : (
        <span className="h-4 w-4 shrink-0" />
      )}
      {label}
    </Link>
  );
}

interface SectionGroup {
  section: string | undefined;
  items: Array<{ href: string; icon: LucideIcon | null; label: string; title?: string }>;
}

function groupBySection(
  navItems: Array<{ id: string; label: string; href: string; icon?: string; section?: string; order?: number }>,
): SectionGroup[] {
  const groups = new Map<string | undefined, SectionGroup>();

  for (const item of navItems) {
    const key = item.section;
    if (!groups.has(key)) {
      groups.set(key, { section: key, items: [] });
    }
    groups.get(key)!.items.push({
      href: item.href,
      icon: resolveIcon(item.icon),
      label: item.label,
    });
  }

  return Array.from(groups.values());
}

export function NeutralShell({ children }: { children: ReactNode }) {
  const { user, session, logout } = useAuth();
  const userPermissions = user?.roles ?? [];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  const navItems = moduleRegistry.getNavItems(userPermissions);
  const groups = groupBySection(navItems);

  const userName = user?.name || user?.email || 'User';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Backdrop overlay — mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-border flex flex-col bg-card transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header row: brand + close button */}
        <div className="h-16 flex items-center justify-between border-b border-border px-4">
          <Link
            href="/app"
            onClick={closeSidebar}
            className="flex items-center gap-2 font-semibold text-lg text-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              B
            </div>
            <span>Balne</span>
          </Link>
          <button
            type="button"
            onClick={closeSidebar}
            className="lg:hidden flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="px-3 py-4">
            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No navigation items available
              </p>
            )}

            {groups.map((group) => (
              <div key={group.section ?? '__root'} className="mb-4">
                {group.section && (
                  <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.section}
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <NavItem key={item.href} {...item} onClick={closeSidebar} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between gap-2 px-3 lg:px-6 bg-background shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-accent shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {session?.organization_id && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {session.is_local_demo ? 'Balneario de muestra' : `Org: ${session.organization_id.slice(0, 8)}...`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {session?.is_local_demo && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Sesión local demo
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1.5 rounded-lg hover:bg-muted/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline text-foreground font-medium">{userName}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/app/perfil" className="flex items-center gap-2 cursor-pointer w-full">
                    <User className="h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
