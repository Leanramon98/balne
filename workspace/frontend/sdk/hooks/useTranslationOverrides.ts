'use client';

import useSWR from 'swr';
import { getActive, create, update, remove } from '@/sdk/api/translation-overrides-api';
import type { TranslationOverride, CreateOverride, UpdateOverride } from '@/sdk/api/translation-overrides-api';

/**
 * SWR hook for translation overrides.
 *
 * Wraps the localStorage-based MVP in a SWR cache shape so the API is
 * identical when the backend HTTP endpoints are implemented — just swap
 * the fetcher and mutator functions.
 *
 * Cache key: ['translation-overrides', locale]
 */
export function useTranslationOverrides(locale: string) {
  const key = ['translation-overrides', locale] as const;

  const { data, error, mutate } = useSWR(key, {
    fetcher: () => getActive(locale),
    revalidateOnFocus: false,
    dedupingInterval: 300_000, // 5 min
  });

  const createOverride = async (input: CreateOverride): Promise<TranslationOverride> => {
    const result = create(input);
    await mutate();
    return result;
  };

  const updateOverride = async (id: string, input: UpdateOverride): Promise<TranslationOverride> => {
    const result = update(id, input);
    await mutate();
    return result;
  };

  const removeOverride = async (id: string): Promise<void> => {
    remove(id);
    await mutate();
  };

  return {
    overrides: data ?? [],
    isLoading: !data && !error,
    error,
    createOverride,
    updateOverride,
    removeOverride,
    mutate,
  };
}
