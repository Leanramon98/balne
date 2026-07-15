'use client';

import { useState } from 'react';
import { ScopeCard } from '@/components/molecules/ScopeCard';
import { EmptyState } from '@/components/atoms/EmptyState';
import { ScopeGridSkeleton } from '@/components/molecules/ScopeGridSkeleton';
import { ClipboardList, Search, LayoutGrid, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScopeProgress } from '@/sdk/hooks/useEvaluations';
import { useTranslations } from 'next-intl';


interface ScopeGridProps {
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

export function ScopeGrid({ evaluationId }: ScopeGridProps) {
  const { scopes, error, isLoading } = useScopeProgress(evaluationId);
  const t = useTranslations('evaluation');
  const dt = useTranslations('display-names');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'uninitiated'>('all');
  const [layoutGrouping, setLayoutGrouping] = useState<'axis' | 'progress'>('axis');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t('scope.progress-title')}</h3>
        <ScopeGridSkeleton />
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

  // Search filter
  const searchFilteredScopes = scopeList.filter(scope => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      scope.scope_name?.toLowerCase().includes(query) ||
      scope.scope_acronym?.toLowerCase().includes(query)
    );
  });

  // Dynamic status counts based on current search query filter
  const countAll = searchFilteredScopes.length;
  const countPending = searchFilteredScopes.filter(s => {
    const roundedPct = Math.round(s.percentage || 0);
    return roundedPct > 0 && roundedPct < 100;
  }).length;
  const countUninitiated = searchFilteredScopes.filter(s => {
    const roundedPct = Math.round(s.percentage || 0);
    return roundedPct === 0;
  }).length;

  // Apply status filter on top of search filter
  const finalFilteredScopes = searchFilteredScopes.filter(s => {
    const roundedPct = Math.round(s.percentage || 0);
    if (statusFilter === 'pending') {
      return roundedPct > 0 && roundedPct < 100;
    }
    if (statusFilter === 'uninitiated') {
      return roundedPct === 0;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 2. Navigation Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
        {/* Search input */}
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t('scope.search-placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
              statusFilter === 'all'
                ? "bg-zinc-900 border-zinc-900 text-white shadow-xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {t('scope.filter.all')} <span className={cn("ml-1 font-bold", statusFilter === 'all' ? "text-zinc-300" : "text-zinc-400")}>{countAll}</span>
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
              statusFilter === 'pending'
                ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {t('scope.filter.pending')} <span className={cn("ml-1 font-bold", statusFilter === 'pending' ? "text-amber-200" : "text-amber-600")}>{countPending}</span>
          </button>
          <button
            onClick={() => setStatusFilter('uninitiated')}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
              statusFilter === 'uninitiated'
                ? "bg-zinc-600 border-zinc-600 text-white shadow-xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {t('scope.filter.uninitiated')} <span className={cn("ml-1 font-bold", statusFilter === 'uninitiated' ? "text-zinc-300" : "text-zinc-500")}>{countUninitiated}</span>
          </button>
        </div>

        {/* Grouping toggles */}
        <div className="flex items-center gap-1.5 border border-zinc-200 p-1 rounded-lg bg-zinc-50 self-start md:self-auto">
          <button
            onClick={() => setLayoutGrouping('axis')}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
              layoutGrouping === 'axis'
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {t('scope.group.axis')}
          </button>
          <button
            onClick={() => setLayoutGrouping('progress')}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
              layoutGrouping === 'progress'
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {t('scope.group.progress')}
          </button>
        </div>
      </div>

      {/* 3. Grouped or Flat list rendering */}
      {finalFilteredScopes.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={t('scope.no-results-title')}
          description={t('scope.no-results-description')}
        />
      ) : layoutGrouping === 'progress' ? (
        // Flat list sorting progress descending
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...finalFilteredScopes]
            .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
            .map((scope) => (
              <ScopeCard
                key={scope.scope_id}
                scope={scope}
                evaluationId={evaluationId}
              />
            ))}
        </div>
      ) : (
        // Grouped list by Axis
        <div className="space-y-8">
          {AXES_CONFIG.map(axis => {
            const axisScopes = finalFilteredScopes.filter(s => getScopeAxis(s) === axis.key);
            if (axisScopes.length === 0) return null;

            // Compute overall axis completion percentage for header
            const allScopesInAxis = scopeList.filter(s => getScopeAxis(s) === axis.key);
            const total = allScopesInAxis.reduce((acc, s) => acc + (s.total_indicators || 0), 0);
            const completed = allScopesInAxis.reduce((acc, s) => acc + (s.completed_indicators || 0), 0);
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={axis.key} className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-3 h-3 rounded-full", axis.color)} />
                    <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">{dt(`axis.${axis.key}` as any)}</h4>
                    <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-bold">
                      {axisScopes.length} {axisScopes.length === 1 ? t('scope.count-one') : t('scope.count-many')}
                    </span>
                  </div>
                  <span className={cn("text-xs font-bold", axis.text)}>
                    {t('scope.completed', { percentage })}
                  </span>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {axisScopes.map((scope, index) => (
                    <ScopeCard
                      key={scope.scope_id}
                      scope={scope}
                      evaluationId={evaluationId}
                      order={index + 1}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}