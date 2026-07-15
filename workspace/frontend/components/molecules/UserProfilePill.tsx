'use client';

import React from 'react';
import { ChevronDown, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';

interface UserProfilePillProps {
  name: string;
  role: string;
}

export function UserProfilePill({ name, role }: UserProfilePillProps) {
  const t = useTranslations('shell');
  const initial = name.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="inline-flex items-center gap-2.5 border border-input rounded-lg px-3 py-2 h-auto bg-background hover:bg-accent cursor-pointer"
        >
          <Avatar className="h-7 w-7 lg:h-8 lg:w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs lg:text-sm font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:block text-left">
            <p className="text-sm font-semibold text-foreground leading-none">{name}</p>
            <p className="text-[11px] text-muted-foreground font-medium leading-none mt-0.5">{role}</p>
          </div>
          <ChevronDown className="hidden lg:block shrink-0 text-muted-foreground" size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <DropdownMenuItem asChild className="cursor-pointer px-3 py-2.5">
          <Link href="/perfil">
            <User className="mr-3 h-4 w-4 text-primary" />
            <span className="text-primary">{t('perfil')}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer px-3 py-2.5 text-destructive focus:text-destructive">
          <LogOut className="mr-3 h-4 w-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
