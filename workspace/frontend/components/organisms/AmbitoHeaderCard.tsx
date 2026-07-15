'use client';

import { cn } from '@/lib/utils';
import { ScopeIcon } from '@/components/atoms/ScopeIcon';
import { EjeBadge } from '@/components/atoms/EjeBadge';
import { useTranslations } from 'next-intl';

interface AmbitoHeaderCardProps {
  code: string;
  name: string;
  eje: string;
  icon?: string;
  totalRequirements?: number;
  totalIndicators?: number;
  completedIndicators?: number;
  indicatorsWithDestinationValue?: number;
  linkedActionsCount?: number;
  className?: string;
}

export function AmbitoHeaderCard({
  code,
  name,
  eje,
  icon,
  totalRequirements = 0,
  totalIndicators = 0,
  completedIndicators = 0,
  indicatorsWithDestinationValue = 0,
  linkedActionsCount = 0,
  className,
}: AmbitoHeaderCardProps) {
  const t = useTranslations('evaluation');
  const pct =
    totalIndicators > 0
      ? Math.round((completedIndicators / totalIndicators) * 100)
      : 0;
  const isComplete = pct === 100;

  return (
    <div
      className={cn(
        'bg-white border border-zinc-200 rounded-[14px] p-6',
        className,
      )}
    >
      {/* Row 1: icon + name + eje + stats */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <ScopeIcon icon={icon} axis={eje} acronym={code} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-zinc-900 leading-tight">
                {name}
              </h2>
              <EjeBadge eje={eje} />
            </div>
          </div>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0 sm:text-right ml-0 sm:ml-auto shrink-0">
          <span className="text-sm text-zinc-500 whitespace-nowrap">
            {t('scope.requirements-count', { n: totalRequirements })} ·{' '}
            {t('scope.total-indicators-count', { n: totalIndicators })}
          </span>
          <div className="flex sm:block items-baseline gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {t('scope.completed-label')}
            </span>
            <span
              className={cn(
                'text-[24px] font-bold leading-none',
                isComplete ? 'text-green-600' : 'text-zinc-900',
              )}
            >
              {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: progress bar */}
      <div className="mt-5">
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isComplete ? 'bg-green-500' : 'bg-blue-500',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500" />
            {completedIndicators} {t('scope.counters.completed').toLowerCase()}
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />
            {indicatorsWithDestinationValue} {t('scope.with-destination-value')}
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-zinc-300" />
            {Math.max(totalIndicators - completedIndicators, 0)} {t('scope.pending')}
          </span>
        </div>
        {linkedActionsCount > 0 && (
          <p className="text-sm text-zinc-500 mt-2">
            {t('scope.actions-count', { n: linkedActionsCount })}
          </p>
        )}
      </div>
    </div>
  );
}
