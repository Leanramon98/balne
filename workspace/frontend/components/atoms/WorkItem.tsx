'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedProgress } from '@/components/atoms/AnimatedProgress';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { useScopeProgress } from '@/sdk/hooks/useEvaluations';
import { ArrowRight, Calendar } from 'lucide-react';
import type { Evaluation } from '@/types';
import { cn } from '@/lib/utils';

interface WorkItemProps {
  evaluation: Evaluation;
  className?: string;
}

export function WorkItem({ evaluation, className }: WorkItemProps) {
  const locale = useLocale();
  const t = useTranslations('page.inicio.work-item');
  const router = useRouter();
  const { scopes, isLoading: isLoadingProgress } = useScopeProgress(evaluation.id);

  const totalIndicators = scopes.reduce((acc, s) => acc + (s.total_indicators || 0), 0);
  const completedIndicators = scopes.reduce(
    (acc, s) => acc + (s.completed_indicators || 0),
    0
  );
  const progress = totalIndicators > 0 ? Math.round((completedIndicators / totalIndicators) * 100) : 0;

  const dueDate = evaluation.end_date
    ? new Date(evaluation.end_date).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <Card className={cn('border-zinc-200', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-zinc-900 truncate">
                {evaluation.name}
              </h3>
              <StatusBadge status={evaluation.status} />
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-500">
              {dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {dueDate}
                </span>
              )}
              {isLoadingProgress ? (
                <Skeleton className="h-3 w-24" />
              ) : (
                <span>
                  {t('indicators-count', { completed: completedIndicators, total: totalIndicators })}
                </span>
              )}
            </div>

            {isLoadingProgress ? (
              <Skeleton className="h-2 w-full" />
            ) : (
              <AnimatedProgress value={progress} className="h-2" />
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => router.push(`/evaluaciones/${evaluation.id}`)}
          >
            {t('continue')}
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
