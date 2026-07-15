'use client';

import { Fragment, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/atoms/EmptyState';
import { ExportBtn } from '@/components/molecules/ExportBtn';
import {
  IndicatorRow,
  type IndicatorRequirementData,
  type IndicatorRowData,
} from '@/components/molecules/IndicatorRow';
import { useScopeIndicators } from '@/sdk/hooks/useScopeIndicators';
import { deleteIndicatorValue, getRequirements } from '@/sdk/api/evaluations-api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Search, ClipboardList, RefreshCw, ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getRequirementName } from '@/lib/requirement-translations';
import type { Requirement } from '@/types';

const BLOCKED_STATUSES = new Set(['carga_finalizada', 'cerrada']);
const INDICATOR_FILTERS = {
  ALL: 'all',
  PENDING: 'pending',
  PARTIAL: 'partial',
  COMPLETE: 'complete',
} as const;

type IndicatorFilter = (typeof INDICATOR_FILTERS)[keyof typeof INDICATOR_FILTERS];

interface IndicatorTableProps {
  evaluationId: string;
  scopeId: string;
  evaluationStatus?: string;
}

interface RequirementGroup {
  requirementId: string;
  requirement?: Requirement | IndicatorRequirementData;
  indicators: IndicatorRowData[];
}

interface RequirementCompletionStats {
  completed: number;
  total: number;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function IndicatorTable({ evaluationId, scopeId, evaluationStatus }: IndicatorTableProps) {
  const { indicators, isLoading, error, mutate } = useScopeIndicators(evaluationId, scopeId);
  const { data: requirements } = useSWR(['requirements', scopeId], () => getRequirements(scopeId));
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<IndicatorFilter>(INDICATOR_FILTERS.ALL);
  const [collapsedRequirementIds, setCollapsedRequirementIds] = useState<Set<string>>(new Set());
  const isBlocked = evaluationStatus ? BLOCKED_STATUSES.has(evaluationStatus) : false;
  const locale = useLocale();
  const t = useTranslations('evaluation');
  const ct = useTranslations('common');

  const allIndicators = indicators as IndicatorRowData[];
  const completedCount = allIndicators.filter((i) => i.is_completed && i.has_evidence).length;
  const partialCount = allIndicators.filter((i) => i.is_completed && !i.has_evidence).length;
  const pendingCount = allIndicators.filter((i) => !i.is_completed).length;
  const requirementsById = new Map((requirements ?? []).map((requirement) => [requirement.id, requirement]));
  const normalizedSearch = search.trim().toLowerCase();
  const hasActiveStatusFilter = activeFilter !== INDICATOR_FILTERS.ALL;

  const requirementStatsById = allIndicators.reduce<Map<string, RequirementCompletionStats>>(
    (stats, indicator) => {
      const requirementId = indicator.requirement_id || 'sin-requisito';
      const current = stats.get(requirementId) ?? { completed: 0, total: 0 };

      stats.set(requirementId, {
        completed: current.completed + (indicator.is_completed && indicator.has_evidence ? 1 : 0),
        total: current.total + 1,
      });

      return stats;
    },
    new Map(),
  );

  const filteredIndicators = allIndicators.filter(
    (indicator) => {
      const requirement = indicator.requirement ?? requirementsById.get(indicator.requirement_id);
      const isCompleted = !!(indicator.is_completed && indicator.has_evidence);
      const isPartial = !!(indicator.is_completed && !indicator.has_evidence);
      const isPending = !indicator.is_completed;
      const matchesFilter =
        activeFilter === INDICATOR_FILTERS.ALL ||
        (activeFilter === INDICATOR_FILTERS.COMPLETE && isCompleted) ||
        (activeFilter === INDICATOR_FILTERS.PARTIAL && isPartial) ||
        (activeFilter === INDICATOR_FILTERS.PENDING && isPending);

      return (
        matchesFilter &&
        (!normalizedSearch ||
          indicator.name?.toLowerCase().includes(normalizedSearch) ||
          indicator.code?.toLowerCase().includes(normalizedSearch) ||
          requirement?.name?.toLowerCase().includes(normalizedSearch) ||
          requirement?.code?.toLowerCase().includes(normalizedSearch))
      );
    },
  );

  const requirementGroups = filteredIndicators.reduce<RequirementGroup[]>((groups, indicator) => {
    const requirementId = indicator.requirement_id || 'sin-requisito';
    const existingGroup = groups.find((group) => group.requirementId === requirementId);

    if (existingGroup) {
      existingGroup.indicators.push(indicator);
      return groups;
    }

    groups.push({
      requirementId,
      requirement: indicator.requirement ?? requirementsById.get(indicator.requirement_id),
      indicators: [indicator],
    });

    return groups;
  }, []);

  const toggleRequirement = (requirementId: string) => {
    setCollapsedRequirementIds((current) => {
      const next = new Set(current);

      if (next.has(requirementId)) {
        next.delete(requirementId);
      } else {
        next.add(requirementId);
      }

      return next;
    });
  };

  const handleDelete = async (indicatorId: string) => {
    try {
      await deleteIndicatorValue(evaluationId, indicatorId);
      toast.success(t('indicators.delete-success'));
      await mutate();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('indicators.delete-error')));
    }
  };

  const exportColumns = [
    { key: 'code', label: t('indicators.export.code') },
    { key: 'name', label: t('indicators.export.name') },
    { key: 'axis_name', label: t('indicators.export.axis') },
    { key: 'is_completed', label: t('indicators.export.completed') },
    { key: 'destination_value', label: t('indicators.export.destination-value') },
    { key: 'evaluator_value', label: t('indicators.export.evaluator-value') },
    { key: 'is_verified', label: t('indicators.export.verified') },
  ];

  return (
    <Card>
      <CardContent className="p-0">
        {/* Blocked evaluation banner */}
        {isBlocked && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-md p-4 text-sm mx-4 mt-4">
            {t('indicators.blocked')}
          </div>
        )}

        {/* Search, filters & export toolbar */}
        <div className="flex flex-wrap items-center gap-4 border-b border-zinc-100 p-4">
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              aria-label={t('indicators.search-label')}
              placeholder={t('indicators.search-placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-[10px] border-zinc-200 bg-white pl-9"
            />
          </div>
          <div className="inline-flex rounded-[10px] border border-zinc-200 bg-zinc-50 p-1">
            {[
              { value: INDICATOR_FILTERS.ALL, label: t('indicators.filter.all'), count: allIndicators.length },
              { value: INDICATOR_FILTERS.PENDING, label: t('indicators.filter.pending'), count: pendingCount },
              { value: INDICATOR_FILTERS.PARTIAL, label: t('indicators.filter.partial'), count: partialCount },
              { value: INDICATOR_FILTERS.COMPLETE, label: t('indicators.filter.complete'), count: completedCount },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={cn(
                  'rounded-[8px] px-3 py-2 text-sm font-medium text-zinc-600 transition-colors',
                  activeFilter === filter.value && 'bg-white text-zinc-900 shadow-sm',
                )}
                aria-pressed={activeFilter === filter.value}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}{' '}
                <span className="text-zinc-400">{filter.count}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <ExportBtn
              data={filteredIndicators}
              columns={exportColumns}
              filename={`indicadores-${scopeId}`}
              tableId="indicators-table"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<ClipboardList className="h-12 w-12" />}
            title={t('indicators.error-title')}
            description={error.message || t('indicators.error-description')}
            action={
              <Button variant="outline" onClick={() => mutate()}>
                <RefreshCw className="mr-2 h-4 w-4" /> {t('table.retry')}
              </Button>
            }
          />
        ) : filteredIndicators.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-12 w-12" />}
            title={search || hasActiveStatusFilter ? t('indicators.empty-results') : t('indicators.empty-title')}
            description={
              search
                ? t('indicators.empty-search')
                : hasActiveStatusFilter
                  ? t('indicators.empty-filter', {
                      status:
                        activeFilter === INDICATOR_FILTERS.PENDING ? t('indicators.filter.pending').toLowerCase() :
                        activeFilter === INDICATOR_FILTERS.PARTIAL ? t('indicators.filter.partial').toLowerCase() :
                        t('indicators.filter.complete').toLowerCase(),
                    })
                : t('indicators.empty-description')
            }
          />
        ) : (
          <Table id="indicators-table">
            <TableHeader>
              <TableRow>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 min-w-[200px]">{t('indicators.table.indicator')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-36">{t('indicators.table.status')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-64">{t('indicators.table.values')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-64 text-right">{t('indicators.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirementGroups.map((group) => {
                const stats = requirementStatsById.get(group.requirementId) ?? {
                  completed: group.indicators.filter((i) => i.is_completed && i.has_evidence).length,
                  total: group.indicators.length,
                };
                const isComplete = stats.total > 0 && stats.completed === stats.total;
                const hasProgress = stats.completed > 0 && !isComplete;
                const isCollapsed = collapsedRequirementIds.has(group.requirementId);
                const requirementLabel = getRequirementName(group.requirement?.code, locale, group.requirement?.name ?? t('indicators.no-requirement'));

                return (
                  <Fragment key={group.requirementId}>
                    <TableRow key={`${group.requirementId}-header`} className="border-y bg-zinc-50 hover:bg-zinc-100">
                      <TableCell colSpan={4} className="p-0">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                          onClick={() => toggleRequirement(group.requirementId)}
                          aria-expanded={!isCollapsed}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 shrink-0 text-zinc-500 transition-transform',
                                isCollapsed && '-rotate-90',
                              )}
                              aria-hidden="true"
                            />
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 shrink-0">
                                {t('indicators.requirement')}
                              </span>
                              {group.requirement?.code && (
                                <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200 shrink-0">
                                  {group.requirement.code}
                                </span>
                              )}
                              <span className="truncate font-semibold text-zinc-900">{requirementLabel}</span>
                            </span>
                          </span>
                          <Badge
                            variant={isComplete ? 'success' : hasProgress ? 'warning' : 'outline'}
                            className="shrink-0 rounded-full"
                          >
                            {stats.completed}/{stats.total}
                          </Badge>
                        </button>
                      </TableCell>
                    </TableRow>
                    <AnimatePresence>
                      {!isCollapsed && group.indicators.map((ind) => (
                        <IndicatorRow
                          key={ind.id}
                          indicator={ind}
                          evaluationId={evaluationId}
                          scopeId={scopeId}
                          onDelete={handleDelete}
                          showActions={!isBlocked}
                        />
                      ))}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
