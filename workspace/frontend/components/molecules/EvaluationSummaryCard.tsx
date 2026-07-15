'use client';

import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvaluationSummaryCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  iconClassName?: string;
  onClick?: () => void;
}

export function EvaluationSummaryCard({
  icon: Icon,
  title,
  subtitle,
  iconClassName,
  onClick,
}: EvaluationSummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 p-5 w-full rounded-xl border border-zinc-200 shadow-sm bg-white text-left transition-colors hover:bg-zinc-50 cursor-pointer'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-11 h-11 rounded-lg shrink-0',
          iconClassName
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-zinc-900">{title}</h4>
        <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
    </button>
  );
}
