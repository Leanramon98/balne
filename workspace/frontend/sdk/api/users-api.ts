// Users Service API Client — BFF Pattern
// ALL requests go through the Next.js BFF (rewrites on client-side, api-gateway on server-side).
// NEVER call services directly — always through api-gateway.

import type { AuditLog, UserProfile, UpdateProfileDTO, AuditLogFilter, Role } from '@/types';

const IS_SERVER = typeof window === 'undefined';

/**
 * BFF base URL strategy:
 * - Client-side: relative path → Next.js rewrites → api-gateway (port 8080)
 * - Server-side: api-gateway internal URL (port 8080)
 * NEVER call users-service (port 8081) directly.
 */
function getBaseUrl(): string {
  if (IS_SERVER) {
    return process.env.INTERNAL_GATEWAY_URL || 'http://localhost:8080';
  }
  return '/api/users';
}

function getAuthToken(): string | null {
  if (IS_SERVER) return null;
  return localStorage.getItem('auth_token');
}

async function request<T>(method: string, path: string, body?: unknown, auth: boolean = true): Promise<T> {
  const baseUrl = getBaseUrl();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
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
    const error = new Error(errBody.error || `${method} ${path} failed: ${res.status}`) as any;
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ========== Profile ==========

export async function getProfile(): Promise<UserProfile> {
  return request('GET', '/profile');
}

export async function updateProfile(data: UpdateProfileDTO): Promise<UserProfile> {
  return request('PUT', '/profile', data);
}

// ========== Roles ==========

export async function getRoles(): Promise<Role[]> {
  const data = await request<{ Items: Role[] }>('GET', '/roles');
  return data.Items || [];
}

// ========== Audit Logs ==========

export async function getAuditLogs(params?: AuditLogFilter): Promise<AuditLog[]> {
  const qs = new URLSearchParams();
  if (params?.entity_type) qs.set('entity_type', params.entity_type);
  if (params?.action) qs.set('action', params.action);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const queryString = qs.toString();
  return request('GET', `/audit-logs${queryString ? `?${queryString}` : ''}`);
}

// ========== Auth Recovery (public) ==========

export async function forgotPassword(email: string): Promise<void> {
  return request('POST', '/auth/forgot-password', { email }, false);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  return request('POST', '/auth/reset-password', { token, new_password: newPassword }, false);
}

// Change the authenticated user's own password. Requires the current password
// as a safety check.
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return request('POST', '/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

// Complete onboarding for first-login users. Sets the initial password without
// requiring the current password (they just authenticated via login).
// Also marks the user's first_login = false on the backend and clears
// the first_login cookie via the BFF so the middleware stops redirecting.
export async function completeOnboarding(newPassword: string): Promise<void> {
  const res = await fetch('/api/auth/complete-onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_password: newPassword }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `complete-onboarding failed: ${res.status}`);
  }
}
