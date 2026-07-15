'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { useDestino } from '@/context/destino-context';
import { useEvaluations } from './useEvaluations';
import { useActions } from './useActions';
import { useAuditLogs } from './useAuditLogs';
import { getScopeProgress } from '@/sdk/api/evaluations-api';
import type { Evaluation, EvaluationStatus } from '@/types';

const ACTIVE_STATUSES: EvaluationStatus[] = [
  'borrador',
  'en_curso',
  'carga_finalizada',
  'en_evaluacion',
];

export interface DashboardKpis {
  activeEvaluations: number;
  pendingActions: number;
  pendingIndicators: number;
  globalProgress: number;
}

export interface DashboardData {
  evaluations: Evaluation[];
  totalEvaluations: number;
  activeEvaluations: Evaluation[];
  kpis: DashboardKpis;
  isLoadingEvaluations: boolean;
  isLoadingActions: boolean;
  isLoadingProgress: boolean;
  isLoadingAuditLogs: boolean;
  errorEvaluations: Error | null;
  errorActions: Error | null;
  errorAuditLogs: Error | null;
}

function useAggregatedProgress(evaluationIds: string[]) {
  const key =
    evaluationIds.length > 0
      ? `dashboard-progress?ids=${evaluationIds.sort().join(',')}`
      : null;

  const { data, error, isLoading } = useSWR(key, async () => {
    const results = await Promise.all(
      evaluationIds.map((id) => getScopeProgress(id))
    );

    let totalIndicators = 0;
    let completedIndicators = 0;

    for (const scopes of results) {
      for (const scope of scopes) {
        totalIndicators += scope.total_indicators;
        completedIndicators += scope.completed_indicators;
      }
    }

    return { totalIndicators, completedIndicators };
  });

  return {
    totalIndicators: data?.totalIndicators ?? 0,
    completedIndicators: data?.completedIndicators ?? 0,
    isLoading,
    error,
  };
}

export function useDashboardData(): DashboardData {
  const { activeDestino } = useDestino();
  const destinationId = activeDestino?.id;

  const {
    evaluations,
    total,
    isLoading: isLoadingEvaluations,
    error: errorEvaluations,
  } = useEvaluations({ destination_id: destinationId, pageSize: 100 });

  const {
    actions,
    isLoading: isLoadingActions,
    error: errorActions,
  } = useActions(destinationId);

  const {
    logs,
    isLoading: isLoadingAuditLogs,
    error: errorAuditLogs,
  } = useAuditLogs({ limit: 10 });

  const activeEvaluations = useMemo(
    () =>
      evaluations
        .filter((e) => ACTIVE_STATUSES.includes(e.status))
        .sort(
          (a, b) =>
            new Date(a.end_date ?? 0).getTime() - new Date(b.end_date ?? 0).getTime()
        ),
    [evaluations]
  );

  const activeIds = useMemo(
    () => activeEvaluations.map((e) => e.id),
    [activeEvaluations]
  );

  const {
    totalIndicators,
    completedIndicators,
    isLoading: isLoadingProgress,
  } = useAggregatedProgress(activeIds);

  const kpis = useMemo(() => {
    const activeCount = activeEvaluations.length;

    const pendingActions = actions.filter(
      (a) => a.status !== 'finalizada' && a.status !== 'descartada'
    ).length;

    const pendingIndicators = totalIndicators - completedIndicators;

    const globalProgress =
      totalIndicators > 0
        ? Math.round((completedIndicators / totalIndicators) * 100)
        : 0;

    return {
      activeEvaluations: activeCount,
      pendingActions,
      pendingIndicators,
      globalProgress,
    };
  }, [activeEvaluations, actions, evaluations, totalIndicators, completedIndicators]);

  return {
    evaluations,
    totalEvaluations: total,
    activeEvaluations,
    kpis,
    isLoadingEvaluations,
    isLoadingActions,
    isLoadingProgress,
    isLoadingAuditLogs,
    errorEvaluations,
    errorActions,
    errorAuditLogs,
  };
}
