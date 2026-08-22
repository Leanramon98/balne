// Bookings Service API Client — BFF Pattern
// ALL requests go through the Next.js BFF (rewrites on client-side, api-gateway on server-side).
// NEVER call services directly — always through api-gateway.
// The gateway rewrites /api/bookings/* → /api/* on the bookings-service (port 8083).

// ===================== Domain types (mirror Go domain) =====================

export interface BookingsBalneario {
  id: string;
  name: string;
  slug: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export type PlanUnitShape = 'rectangle' | 'circle';
export type PlanUnitStatus = 'available' | 'occupied' | 'held' | 'maintenance';

export interface BookingsPlanUnit {
  id: string;
  balneario_id: string;
  unit_number: string;
  zone: string;
  capacity: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  shape: PlanUnitShape;
  is_rentable: boolean;
  status: PlanUnitStatus;
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'checked_out';

export interface BookingsReservation {
  id: string;
  balneario_id: string;
  unit_id: string;
  customer_id: string;
  start_date: string;
  end_date: string;
  guest_count: number;
  status: ReservationStatus;
  total_price: number;
  notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BookingsCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export type TariffPeriod = 'day' | 'week' | 'fortnight' | 'season';

export interface BookingsTariff {
  id: string;
  balneario_id: string;
  unit_type: string;
  period: TariffPeriod;
  price: number;
  currency: string;
  season: string;
}

// ===================== Request DTOs =====================

export interface PublicReservationInput {
  unit_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  guest_count: number;
  total_price: number;
  notes?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface InternalReservationInput {
  balneario_id: string;
  unit_id: string;
  customer_id: string;
  start_date: string;
  end_date: string;
  guest_count: number;
  total_price: number;
  notes?: string;
  created_by?: string;
}

export interface ReservationFilters {
  balneario_id?: string;
  status?: ReservationStatus | '';
}

export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
}

export interface TariffInput {
  balneario_id: string;
  unit_type: string;
  period: TariffPeriod;
  price: number;
  currency: string;
  season: string;
}

// ===================== Client =====================

const IS_SERVER = typeof window === 'undefined';

/**
 * BFF base URL strategy (mirrors users-api.ts):
 * - Client-side: relative path `/api/bookings` → Next.js BFF catch-all → api-gateway
 *   The BFF route injects the `auto_insight_token` cookie as `Authorization: Bearer …`
 *   for internal (JWT-gated) endpoints, so client code does not need to manage auth
 *   headers for proxied calls.
 * - Server-side: `INTERNAL_GATEWAY_URL + /api/bookings` → direct to api-gateway.
 *   Public endpoints need no auth. Internal endpoints called from server components
 *   would need the request cookie forwarded; the BFF handles that for client paths.
 */
function getBaseUrl(): string {
  if (IS_SERVER) {
    const gateway = process.env.INTERNAL_GATEWAY_URL || 'http://localhost:8080';
    return `${gateway}/api/bookings`;
  }
  return '/api/bookings';
}

function getAuthToken(): string | null {
  if (IS_SERVER) return null;
  return localStorage.getItem('auth_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth: boolean = true,
): Promise<T> {
  const baseUrl = getBaseUrl();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    // On the client, the BFF already injects Authorization from the httpOnly cookie.
    // We also attach the localStorage token when present (belt-and-suspenders) so
    // direct gateway calls from the server can still authenticate when needed.
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    if (!IS_SERVER) window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const error = new Error(
      (errBody as Record<string, unknown>).message as string ||
        (errBody as Record<string, unknown>).error as string ||
        `${method} ${path} failed: ${res.status}`,
    ) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ===================== Public endpoints (no auth) =====================

export async function getBalnearioBySlug(slug: string): Promise<BookingsBalneario> {
  return request<BookingsBalneario>('GET', `/balnearios/${encodeURIComponent(slug)}`, undefined, false);
}

export async function getPlanUnits(slug: string): Promise<BookingsPlanUnit[]> {
  return request<BookingsPlanUnit[]>('GET', `/balnearios/${encodeURIComponent(slug)}/units`, undefined, false);
}

export async function getAvailability(
  slug: string,
  start: string,
  end: string,
): Promise<BookingsPlanUnit[]> {
  const qs = new URLSearchParams({ start, end }).toString();
  return request<BookingsPlanUnit[]>(
    'GET',
    `/balnearios/${encodeURIComponent(slug)}/availability?${qs}`,
    undefined,
    false,
  );
}

export async function createPublicReservation(
  slug: string,
  data: PublicReservationInput,
): Promise<BookingsReservation> {
  return request<BookingsReservation>(
    'POST',
    `/balnearios/${encodeURIComponent(slug)}/reservations`,
    data,
    false,
  );
}

// ===================== Internal endpoints (JWT via BFF cookie) =====================

export async function listBalnearios(): Promise<BookingsBalneario[]> {
  return request<BookingsBalneario[]>('GET', '/balnearios');
}

export async function getBalnearioPlan(id: string): Promise<BookingsPlanUnit[]> {
  return request<BookingsPlanUnit[]>('GET', `/balnearios/${encodeURIComponent(id)}/plan`);
}

export async function saveBalnearioPlan(
  balnearioId: string,
  units: Partial<BookingsPlanUnit>[],
): Promise<BookingsPlanUnit[]> {
  return request<BookingsPlanUnit[]>(
    'PUT',
    `/balnearios/${encodeURIComponent(balnearioId)}/plan`,
    { units },
  );
}

export async function createInternalReservation(
  data: InternalReservationInput,
): Promise<BookingsReservation> {
  return request<BookingsReservation>('POST', '/reservations', data);
}

export async function listReservations(
  filters: ReservationFilters,
): Promise<BookingsReservation[]> {
  const qs = new URLSearchParams();
  if (filters.balneario_id) qs.set('balneario_id', filters.balneario_id);
  if (filters.status) qs.set('status', filters.status);
  const queryString = qs.toString();
  return request<BookingsReservation[]>(
    'GET',
    `/reservations${queryString ? `?${queryString}` : ''}`,
  );
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
): Promise<{ status: ReservationStatus }> {
  return request<{ status: ReservationStatus }>(
    'PUT',
    `/reservations/${encodeURIComponent(id)}/status`,
    { status },
  );
}

export async function createCustomer(data: CustomerInput): Promise<BookingsCustomer> {
  return request<BookingsCustomer>('POST', '/customers', data);
}

export async function searchCustomers(query: string): Promise<BookingsCustomer[]> {
  const qs = new URLSearchParams({ q: query }).toString();
  return request<BookingsCustomer[]>(`GET`, `/customers?${qs}`);
}

export async function listTariffs(balnearioId: string): Promise<BookingsTariff[]> {
  return request<BookingsTariff[]>('GET', `/tariffs/${encodeURIComponent(balnearioId)}`);
}

export async function createTariff(data: TariffInput): Promise<BookingsTariff> {
  return request<BookingsTariff>('POST', '/tariffs', data);
}

export async function updatePlanUnit(
  id: string,
  data: Partial<BookingsPlanUnit>,
): Promise<BookingsPlanUnit> {
  return request<BookingsPlanUnit>(
    'PUT',
    `/plan-units/${encodeURIComponent(id)}`,
    data,
  );
}

