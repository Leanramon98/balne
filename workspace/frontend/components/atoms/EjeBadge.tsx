'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const AXIS_COLOR_MAP: Record<string, string> = {
  gob: 'bg-blue-100 text-blue-700',
  inn: 'bg-purple-100 text-purple-700',
  tec: 'bg-cyan-100 text-cyan-700',
  sost: 'bg-green-100 text-green-700',
  acc: 'bg-orange-100 text-orange-700',
};

const EJE_COLOR_MAP: Record<string, string> = {
  '1': 'bg-blue-100 text-blue-700',
  I: 'bg-blue-100 text-blue-700',
  '2': 'bg-purple-100 text-purple-700',
  II: 'bg-purple-100 text-purple-700',
  '3': 'bg-green-100 text-green-700',
  III: 'bg-green-100 text-green-700',
  '4': 'bg-orange-100 text-orange-700',
  IV: 'bg-orange-100 text-orange-700',
  '5': 'bg-pink-100 text-pink-700',
  V: 'bg-pink-100 text-pink-700',
};

function getEjeColors(eje: string): string {
  const lower = eje.toLowerCase().trim();
  if (AXIS_COLOR_MAP[lower]) return AXIS_COLOR_MAP[lower];
  const upper = eje.toUpperCase().trim();
  if (EJE_COLOR_MAP[upper]) return EJE_COLOR_MAP[upper];
  const first = upper.split(/[\s\-_]/)[0];
  if (EJE_COLOR_MAP[first]) return EJE_COLOR_MAP[first];
  return 'bg-zinc-100 text-zinc-700';
}

interface EjeBadgeProps {
  eje: string;
  className?: string;
}

export function EjeBadge({ eje, className }: EjeBadgeProps) {
  const t = useTranslations('display-names');
  const colors = getEjeColors(eje);
  const label = t(`axis.${eje.toLowerCase()}` as any) ?? eje;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold',
        colors,
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
