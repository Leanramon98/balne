'use client';

import useSWR from 'swr';
import { getGoodPractices } from '@/sdk/api/evaluations-api';

export function useGoodPractices(filters?: {
  scope_id?: string;
  axis?: string;
  country?: string;
  locale?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.scope_id) params.set('scope_id', filters.scope_id);
  if (filters?.axis) params.set('axis', filters.axis);
  if (filters?.country) params.set('country', filters.country);
  if (filters?.locale) params.set('locale', filters.locale);
  const qs = params.toString();
  const key = `public/good-practices${qs ? `?${qs}` : ''}`;

  const { data, error, mutate } = useSWR(key, () => getGoodPractices(filters));

  return {
    practices: data ?? [],
    isLoading: !data && !error,
    error,
    mutate,
  };
}
