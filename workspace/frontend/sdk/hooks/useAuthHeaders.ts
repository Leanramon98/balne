'use client';

import { useCallback } from 'react';
import { getAuthHeaders } from '@/lib/auth';

export function useAuthHeaders() {
  return useCallback(() => getAuthHeaders(), []);
}
