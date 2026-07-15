'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScopeIcon } from '@/components/atoms/ScopeIcon';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { getScopeName } from '@/lib/scope-translations';
import type { ScopeProgress } from '@/types';

interface ScopeCardProps {
  scope: ScopeProgress;
  evaluationId: string;
  order?: number;
}

export function ScopeCard({ scope, evaluationId, order }: ScopeCardProps) {
  const t = useTranslations('evaluation');
  const locale = useLocale();
  const roundedPct = Math.round(scope.percentage || 0);
  const hasIndicators = scope.total_indicators > 0;

  return (
    <Link href={`/evaluaciones/${evaluationId}/ambitos/${scope.scope_id}`}>
      <Card
        className={cn(
          'cursor-pointer hover:shadow-md transition-all p-3.5 flex items-center justify-between gap-4 h-full',
          roundedPct === 0 && 'opacity-60',
        )}
      >
        {/* Left: Monogram and name + indicators count */}
        <div className="flex items-center gap-3 min-w-0">
          <ScopeIcon icon={scope.scope_icon} axis={scope.axis} acronym={scope.scope_acronym} size="sm" order={order} />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-zinc-900 truncate">
              {getScopeName(scope.scope_acronym, locale, scope.scope_name)}
            </span>
            <span className="text-xs text-zinc-500 font-medium">
              {hasIndicators
                ? t('scope.indicators-count', { completed: scope.completed_indicators, total: scope.total_indicators })
                : t('scope.no-indicators')}
            </span>
          </div>
        </div>

        {/* Right: Percentage and progress bar */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={cn(
              'text-sm font-bold',
              roundedPct === 0
                ? 'text-zinc-400'
                : roundedPct === 100
                  ? 'text-green-600'
                  : 'text-amber-600',
            )}
          >
            {roundedPct}%
          </span>
          <Progress
            value={scope.percentage}
            className={cn(
              'w-16 sm:w-24 h-1.5',
              roundedPct === 0
                ? '[&>div]:bg-zinc-200'
                : roundedPct === 100
                  ? '[&>div]:bg-green-600'
                  : '[&>div]:bg-amber-500',
            )}
          />
        </div>
      </Card>
    </Link>
  );
}
