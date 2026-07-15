'use client';

import { EmptyState } from '@/components/atoms/EmptyState';
import { ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useScopeProgress } from '@/sdk/hooks/useEvaluations';
import { useTranslations } from 'next-intl';

interface ScopeProgressDashboardProps {
  evaluationId: string;
}

const AXES_CONFIG = [
  { key: 'gob', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50/50' },
  { key: 'inn', color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50/50' },
  { key: 'tec', color: 'bg-cyan-500', text: 'text-cyan-700', bg: 'bg-cyan-50/50' },
  { key: 'sost', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50/50' },
  { key: 'acc', color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50/50' },
] as const;

const getScopeAxis = (s: { axis?: string; scope_acronym?: string }) => {
  return (s.axis || '').toLowerCase();
};

export function ScopeProgressDashboard({ evaluationId }: ScopeProgressDashboardProps) {
  const { scopes, error, isLoading } = useScopeProgress(evaluationId);
  const t = useTranslations('evaluation');
  const dt = useTranslations('display-names');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-950">{t('scope.progress-title')}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white p-5 rounded-xl border border-zinc-100 shadow-sm flex items-center gap-5">
            <Skeleton className="w-20 h-20 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col justify-center space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-zinc-100 shadow-sm flex flex-col justify-between min-h-[90px] space-y-2">
              <Skeleton className="h-3 w-20" />
              <div className="flex items-baseline justify-between">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-8 w-8" />}
        title={t('scope.error-title')}
        description={error.message || t('scope.error-description')}
      />
    );
  }

  const scopeList = scopes;

  if (scopeList.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t('scope.progress-title')}</h3>
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={t('scope.empty-title')}
          description={t('scope.empty-description')}
        />
      </div>
    );
  }

  // Global calculations
  const totalIndicators = scopeList.reduce((acc, s) => acc + (s.total_indicators || 0), 0);
  const completedIndicators = scopeList.reduce((acc, s) => acc + (s.completed_indicators || 0), 0);
  const completionPercent = totalIndicators > 0
    ? Math.round((completedIndicators / totalIndicators) * 100)
    : 0;

  const scopesWithProgress = scopeList.filter(s => {
    const roundedPct = Math.round(s.percentage || 0);
    return roundedPct > 0 && roundedPct < 100;
  }).length;

  const completedScopes = scopeList.filter(s => {
    const roundedPct = Math.round(s.percentage || 0);
    return roundedPct === 100;
  }).length;

  const uninitiatedScopes = scopeList.filter(s => {
    const roundedPct = Math.round(s.percentage || 0);
    return roundedPct === 0;
  }).length;

  // Axis Rollup Metrics
  const axisRollups = AXES_CONFIG.map(axis => {
    const scopesInAxis = scopeList.filter(s => getScopeAxis(s) === axis.key);
    const total = scopesInAxis.reduce((acc, s) => acc + (s.total_indicators || 0), 0);
    const completed = scopesInAxis.reduce((acc, s) => acc + (s.completed_indicators || 0), 0);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { ...axis, percentage, total, completed };
  });

  // SVG circular progress parameters
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-950">{t('scope.progress-title')}</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {/* Global progress ring card */}
        <div className="bg-white p-5 rounded-xl border border-zinc-100 shadow-sm flex items-center gap-5">
          <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r={radius} className="stroke-zinc-100 fill-none" strokeWidth={strokeWidth} />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-blue-600 fill-none transition-all duration-300"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-base font-bold text-zinc-900">{completionPercent}%</span>
              <span className="text-[9px] text-zinc-500 font-semibold">{t('scope.group.progress').toLowerCase()}</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 text-sm">{t('scope.global-title')}</h4>
            <p className="text-xs text-zinc-500 mt-0.5">{t('scope.global-description')}</p>
          </div>
        </div>

        {/* Counters & stats */}
        <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col justify-center">
            <span className="text-xs font-semibold text-zinc-500">{t('scope.counters.indicators')}</span>
            <span className="text-lg font-bold text-zinc-900 mt-1">{completedIndicators} / {totalIndicators}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col justify-center">
            <span className="text-xs font-semibold text-zinc-500">{t('scope.counters.en-progress')}</span>
            <span className="text-lg font-bold text-amber-600 mt-1">{scopesWithProgress}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col justify-center">
            <span className="text-xs font-semibold text-zinc-500">{t('scope.counters.completed')}</span>
            <span className="text-lg font-bold text-green-600 mt-1">{completedScopes}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col justify-center">
            <span className="text-xs font-semibold text-zinc-500">{t('scope.counters.uninitiated')}</span>
            <span className="text-lg font-bold text-zinc-400 mt-1">{uninitiatedScopes}</span>
          </div>
        </div>
      </div>

      {/* Axis Rollups */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {axisRollups.map(rollup => (
          <div key={rollup.key} className={cn("p-3.5 rounded-xl border border-zinc-100 shadow-sm flex flex-col justify-between min-h-[90px]", rollup.bg)}>
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", rollup.color)} />
              <span className="text-xs font-bold text-zinc-800 truncate">{dt(`axis.${rollup.key}` as any)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={cn("text-lg font-bold", rollup.text)}>{rollup.percentage}%</span>
              <span className="text-[10px] text-zinc-500 font-medium">
                {rollup.completed}/{rollup.total} {t('scope.indicators-short')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
