'use client';

import useSWR from 'swr';
import {
  getBalnearioBySlug,
  getPlanUnits,
  getAvailability,
  listReservations,
  type BookingsBalneario,
  type BookingsPlanUnit,
  type BookingsReservation,
  type ReservationFilters,
} from '@/sdk/api/bookings-api';

/**
 * SWR hooks for the bookings-service. Every hook falls back to `null` on error
 * so callers can detect "no live data" and switch to demo fixtures. The `isLive`
 * flag is true only when the API returned data without error.
 */

export function useBalneario(slug: string | null) {
  const { data, error, mutate } = useSWR<BookingsBalneario>(
    slug ? ['bookings', 'balneario', slug] : null,
    () => getBalnearioBySlug(slug as string),
  );
  return {
    balneario: data ?? null,
    isLoading: !!slug && !data && !error,
    error: error ?? null,
    isLive: !!data && !error,
    mutate,
  };
}

export function usePlanUnits(slug: string | null) {
  const { data, error, mutate } = useSWR<BookingsPlanUnit[]>(
    slug ? ['bookings', 'plan-units', slug] : null,
    () => getPlanUnits(slug as string),
  );
  return {
    units: data ?? null,
    isLoading: !!slug && !data && !error,
    error: error ?? null,
    isLive: !!data && !error,
    mutate,
  };
}

export function useAvailability(slug: string | null, start?: string, end?: string) {
  const enabled = !!slug && !!start && !!end;
  const { data, error, mutate } = useSWR<BookingsPlanUnit[]>(
    enabled ? ['bookings', 'availability', slug, start, end] : null,
    () => getAvailability(slug as string, start as string, end as string),
  );
  return {
    availability: data ?? null,
    isLoading: enabled && !data && !error,
    error: error ?? null,
    isLive: !!data && !error,
    mutate,
  };
}

export function useReservations(filters: ReservationFilters | null) {
  const key = filters ? ['bookings', 'reservations', JSON.stringify(filters)] : null;
  const { data, error, mutate } = useSWR<BookingsReservation[]>(key, () =>
    listReservations(filters as ReservationFilters),
  );
  return {
    reservations: data ?? null,
    isLoading: !!filters && !data && !error,
    error: error ?? null,
    isLive: !!data && !error,
    mutate,
  };
}
