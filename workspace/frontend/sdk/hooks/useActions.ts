'use client';

import useSWR from 'swr';
import { getActions, getAction, getEvidence, uploadFile } from '@/sdk/api/evaluations-api';
import { useCallback } from 'react';

export function useActions(destinationId?: string) {
  const key = destinationId
    ? `actions?destination_id=${destinationId}`
    : 'actions';

  const { data, error, isLoading, mutate } = useSWR(key, () => getActions(destinationId || undefined));

  return {
    actions: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useAction(id?: string) {
  const { data, error, mutate } = useSWR(
    id ? `action/${id}` : null,
    () => getAction(id!),
  );

  return {
    action: data,
    isLoading: !data && !error,
    error,
    mutate,
  };
}

export function useEvidence(actionId: string, evaluationId?: string) {
  const { data, error, mutate } = useSWR(
    actionId ? `evidence/${actionId}` : null,
    () => getEvidence(actionId),
  );

  const addFile = useCallback(async (file: File) => {
    if (!evaluationId) {
      throw new Error('evaluationId is required to upload evidence');
    }
    const result = await uploadFile(actionId, evaluationId, file);
    await mutate();
    return result;
  }, [actionId, evaluationId, mutate]);

  return {
    evidence: data ?? [],
    isLoading: !data && !error,
    error,
    addFile,
    mutate,
  };
}
