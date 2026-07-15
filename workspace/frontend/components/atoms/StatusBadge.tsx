'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

const STATUS_MAP: Record<string, { className: string }> = {
  borrador: {
    className: 'bg-zinc-100 text-zinc-600',
  },
  en_curso: {
    className: 'bg-blue-50 text-blue-700',
  },
  carga_finalizada: {
    className: 'bg-yellow-50 text-yellow-700',
  },
  en_evaluacion: {
    className: 'bg-blue-50 text-blue-700',
  },
  cerrada: {
    className: 'bg-green-50 text-green-700',
  },
  anulada: {
    className: 'bg-zinc-100 text-zinc-500',
  },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('display-names');
  const config = STATUS_MAP[status] ?? { className: 'bg-zinc-100 text-zinc-600' };
  const label = STATUS_MAP[status] ? t(`eval-status.${status}`) : status;
  const description = STATUS_MAP[status] ? t(`eval-status-desc.${status}`) : '';

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', config.className)}>
            {label}
          </span>
        </TooltipTrigger>
        {description && (
          <TooltipContent side="top" className="max-w-64 text-center">
            {description}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
