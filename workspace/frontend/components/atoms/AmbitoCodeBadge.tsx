'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const LETTER_COLOR_MAP: Record<string, string> = {
  G: 'bg-blue-100 text-blue-700',
  T: 'bg-purple-100 text-purple-700',
  S: 'bg-green-100 text-green-700',
  I: 'bg-orange-100 text-orange-700',
};

function getAmbitoColors(code: string): string {
  const firstLetter = code.charAt(0).toUpperCase();
  return LETTER_COLOR_MAP[firstLetter] ?? 'bg-zinc-100 text-zinc-700';
}

interface AmbitoCodeBadgeProps {
  code: string;
  order?: number;
  className?: string;
}

export function AmbitoCodeBadge({ code, order, className }: AmbitoCodeBadgeProps) {
  const colors = getAmbitoColors(code);
  const display = code.charAt(0).toUpperCase() + (order != null && order > 0 ? order : '');
  return (
    <span
      className={cn(
        'w-[46px] h-[38px] rounded-[9px] flex items-center justify-center text-sm font-bold flex-shrink-0',
        colors,
        className,
      )}
    >
      {display}
    </span>
  );
}
