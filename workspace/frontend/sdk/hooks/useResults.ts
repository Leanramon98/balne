'use client';

import useSWR from 'swr';
import { getResults } from '@/sdk/api/evaluations-api';
import type { ResultsData } from '@/types';

export function useResults(filters?: {
  scope_id?: string;
  axis?: string;
  country?: string;
  typology_id?: string;
  member_type_id?: string;
  destination_id?: string;
  year?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.scope_id) params.set('scope_id', filters.scope_id);
  if (filters?.axis) params.set('axis', filters.axis);
  if (filters?.country) params.set('country', filters.country);
  if (filters?.typology_id) params.set('typology_id', filters.typology_id);
  if (filters?.member_type_id) params.set('member_type_id', filters.member_type_id);
  if (filters?.destination_id) params.set('destination_id', filters.destination_id);
  if (filters?.year) params.set('year', String(filters.year));
  const key = `results?${params.toString()}`;

  const { data, error, mutate } = useSWR(
    filters && Object.keys(filters).length > 0 ? key : null,
    () => getResults(filters),
  );

  return {
    results: data as ResultsData[] | undefined,
    isLoading: !data && !error,
    error,
    mutate,
  };
}
