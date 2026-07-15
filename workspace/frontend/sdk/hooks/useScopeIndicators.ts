'use client';

import useSWR from 'swr';
import { getScopeIndicators, getIndicatorValue } from '@/sdk/api/evaluations-api';
import type { Indicator, IndicatorValue } from '@/types';

export function useScopeIndicators(evaluationId?: string, scopeId?: string) {
  const key = evaluationId && scopeId ? `evaluation/${evaluationId}/scope/${scopeId}/indicators` : null;

  const { data, error, mutate } = useSWR(key, () => getScopeIndicators(evaluationId!, scopeId!));

  return {
    indicators: data ?? [],
    isLoading: !data && !error,
    error,
    mutate,
  };
}

export function useIndicatorValue(evaluationId?: string, indicatorId?: string) {
  const key = evaluationId && indicatorId ? `evaluation/${evaluationId}/indicator/${indicatorId}/value` : null;

  const { data, error, mutate } = useSWR(key, () => getIndicatorValue(evaluationId!, indicatorId!));

  return {
    value: data,
    isLoading: !data && !error,
    error,
    mutate,
  };
}
