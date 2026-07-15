'use client';

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { getProfile, updateProfile } from '@/sdk/api/users-api';
import type { UpdateProfileDTO, UserProfile } from '@/types';

export function useProfile() {
  const { data, error, mutate } = useSWR('profile', getProfile);

  // Backend wraps the user inside { Item: {...} } — unwrap it for convenience
  const profile = data && 'Item' in data ? (data as Record<string, unknown>).Item : data;

  return {
    profile: profile as Record<string, unknown> | null,
    isLoading: !data && !error,
    error,
    mutate,
  };
}

export function useUpdateProfile() {
  const { trigger, isMutating, error } = useSWRMutation(
    'profile',
    (_key: string, { arg }: { arg: UpdateProfileDTO }) => updateProfile(arg),
  );

  return {
    updateProfile: trigger,
    isUpdating: isMutating,
    error,
  };
}
