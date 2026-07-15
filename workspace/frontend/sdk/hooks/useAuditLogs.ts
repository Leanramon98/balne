'use client';

import useSWR from 'swr';
import { getAuditLogs } from '@/sdk/api/users-api';
import type { AuditLogFilter } from '@/types';

export function useAuditLogs(filters?: AuditLogFilter) {
  const key = `audit-logs${filters ? `?${JSON.stringify(filters)}` : ''}`;

  const { data, error, mutate } = useSWR(key, () => getAuditLogs(filters));

  return {
    logs: data ?? [],
    isLoading: !data && !error,
    error,
    mutate,
  };
}
