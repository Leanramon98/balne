'use client';

import useSWR from 'swr';
import { getDtiPlans, getDtiPlan } from '@/sdk/api/evaluations-api';

export function useDtiPlans(destinationId?: string) {
  const key = destinationId ? `dti-plans?destination_id=${destinationId}` : null;

  const { data, error, mutate } = useSWR(key, () => getDtiPlans(destinationId!));

  return {
    plans: data ?? [],
    isLoading: !data && !error,
    error,
    mutate,
  };
}

export function useDtiPlan(id?: string) {
  const { data, error, mutate } = useSWR(
    id ? `dti-plan/${id}` : null,
    () => getDtiPlan(id!),
  );

  return {
    plan: data,
    isLoading: !data && !error,
    error,
    mutate,
  };
}
