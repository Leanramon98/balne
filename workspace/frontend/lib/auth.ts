/**
 * Auth utilities — pure functions, safe to use anywhere.
 */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function parsePayload(token: string): Record<string, any> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/** Returns auth headers for fetch requests. */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** Extracts user roles from JWT payload. */
export function getUserRoles(): string[] {
  const token = getToken();
  if (!token) return [];
  const payload = parsePayload(token);
  if (!payload) return [];
  return payload.roles || (payload.role ? [payload.role] : []);
}

/** Extracts single user role from JWT payload. */
export function getUserRole(): string {
  const token = getToken();
  if (!token) return '';
  const payload = parsePayload(token);
  if (!payload) return '';
  return payload.role || '';
}

/** Extracts user name/email from JWT payload. */
export function getUserName(fallback = 'Usuario'): string {
  const token = getToken();
  if (!token) return fallback;
  const payload = parsePayload(token);
  if (!payload) return fallback;
  return payload.full_name || payload.name || payload.email || fallback;
}

/** Extracts user ID (sub or id) from JWT payload. */
export function getUserId(fallback = 'unknown'): string {
  const token = getToken();
  if (!token) return fallback;
  const payload = parsePayload(token);
  if (!payload) return fallback;
  return payload.id || payload.sub || fallback;
}

/** Roles with global admin access (can select any destination). */
export const ADMIN_ROLES = ['admin'];

/** Roles that can act as destination to write indicator values. */
export const DESTINATION_ROLES = [
  'admin',
  'admin_destino',
  'gestor_destino',
  'consultor',
  'auditor',
  'gestor_regional',
  'gestor_nacional',
];

/** Roles that can open the destino selector in the header. */
export const CAN_SELECT_DESTINO_ROLES = ['admin'];

/** Roles that have evaluator privileges. */
export const EVALUATOR_ROLES = ['admin', 'auditor', 'gestor_nacional'];

/** Checks if the current user has at least one of the given roles. */
export function hasAnyRole(roles: string[]): boolean {
  const userRoles = getUserRoles();
  return roles.some(role => userRoles.includes(role));
}

/** Extracts destination_id from JWT payload. */
export function getDestinationId(): string | null {
  const token = getToken();
  if (!token) return null;
  const payload = parsePayload(token);
  if (!payload) return null;
  return payload.destination_id || null;
}
