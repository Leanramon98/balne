'use client';

import useSWR from 'swr';
import { getContentTranslations } from '@/sdk/api/evaluations-api';
import type { ActionTranslation } from '@/types';

export function useContentTranslations(filters?: {
  locale?: string;
  reviewed?: boolean;
}) {
  const params = new URLSearchParams();
  if (filters?.locale) params.set('locale', filters.locale);
  if (filters?.reviewed !== undefined) params.set('reviewed', String(filters.reviewed));
  const qs = params.toString();
  const key = `admin/translations/content${qs ? `?${qs}` : ''}`;

  const { data, error, mutate } = useSWR(key, () => getContentTranslations(filters));

  return {
    translations: data as ActionTranslation[] | undefined,
    isLoading: !data && !error,
    error,
    mutate,
  };
}
