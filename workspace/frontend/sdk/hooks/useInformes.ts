'use client';

import useSWR from 'swr';
import { getInformes } from '@/sdk/api/evaluations-api';
import type { Informe } from '@/types';

export function useInformes() {
  const { data, error, mutate } = useSWR('informes', () => getInformes());

  return {
    informes: data as Informe[] | undefined,
    isLoading: !data && !error,
    error,
    mutate,
  };
}
