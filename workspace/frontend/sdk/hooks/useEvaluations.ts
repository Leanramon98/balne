'use client';

import { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { getEvaluations, getEvaluation, getScopeProgress, getScopes } from '@/sdk/api/evaluations-api';
import type { Evaluation, EvaluationStatus, EvaluationType, PaginatedEvaluations } from '@/types';

const DEFAULT_PAGE_SIZE = 20;

export function useEvaluations(filters?: {
  destination_id?: string;
  type?: EvaluationType;
  status?: EvaluationStatus;
  pageSize?: number;
  enabled?: boolean;
}) {
  const [page, setPage] = useState(1);
  const enabled = filters?.enabled ?? true;
  const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE;

  const params = new URLSearchParams();
  if (filters?.destination_id) params.set('destination_id', filters.destination_id);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  params.set('limit', String(pageSize));
  params.set('offset', String((page - 1) * pageSize));
  const key = enabled ? `evaluations?${params.toString()}` : null;

  const { data, error, mutate } = useSWR(key, () =>
    getEvaluations({
      destination_id: filters?.destination_id,
      type: filters?.type,
      status: filters?.status,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
  );

  const totalPages = useMemo(() => {
    if (!data?.total) return 1;
    return Math.ceil(data.total / pageSize);
  }, [data?.total, pageSize]);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  return {
    evaluations: data?.data ?? [],
    total: data?.total ?? 0,
    limit: data?.limit ?? pageSize,
    offset: data?.offset ?? 0,
    isLoading: enabled && !data && !error,
    error,
    mutate,
    pagination: {
      page,
      pageSize,
      totalPages,
      goToPage,
      nextPage,
      prevPage,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export function useEvaluation(id?: string) {
  const { data, error, mutate } = useSWR(
    id ? `evaluation/${id}` : null,
    () => getEvaluation(id!),
    { revalidateOnFocus: false },
  );

  return {
    evaluation: data,
    isLoading: !data && !error,
    error,
    mutate,
  };
}

export function useScopeProgress(evaluationId?: string) {
  const { data: progress, error: progressError } = useSWR(
    evaluationId ? `evaluation/${evaluationId}/scopes` : null,
    () => getScopeProgress(evaluationId!),
  );

  const { data: scopesCatalog } = useSWR('scopes', getScopes, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });

  const scopes = useMemo(() => {
    if (!progress) return [];
    if (!scopesCatalog) return progress;
    const axisMap = new Map(scopesCatalog.map((s) => [s.id, s.axis]));
    return progress.map((p) => ({
      ...p,
      axis: axisMap.get(p.scope_id) || p.axis,
    }));
  }, [progress, scopesCatalog]);

  return {
    scopes,
    isLoading: !progress && !progressError,
    error: progressError,
  };
}
