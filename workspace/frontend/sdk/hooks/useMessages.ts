'use client';

import useSWR from 'swr';
import { getIndicatorMessages, sendIndicatorMessage } from '@/sdk/api/evaluations-api';
import type { IndicatorMessage } from '@/types';

export function useMessages(indicatorValueId?: string) {
  const key = indicatorValueId ? `messages/${indicatorValueId}` : null;

  const { data, error, mutate } = useSWR(key, () => getIndicatorMessages(indicatorValueId!), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const sendMessage = async (message: string): Promise<IndicatorMessage> => {
    const result = await sendIndicatorMessage(indicatorValueId!, message);
    await mutate();
    return result;
  };

  return {
    messages: data ?? [],
    isLoading: !!key && !data && !error,
    error,
    sendMessage,
    mutate,
  };
}
