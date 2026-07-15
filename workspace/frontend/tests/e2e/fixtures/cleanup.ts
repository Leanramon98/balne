const API_URL = process.env.API_URL || 'http://localhost:8080';

interface FetchOptions {
  method: string;
  path: string;
  token: string;
  body?: unknown;
}

/**
 * Thin fetch wrapper that tolerates 404s for idempotent cleanup.
 */
async function apiRequest({ method, path, token, body }: FetchOptions): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 404) {
    // Already gone — idempotent cleanup.
    return;
  }

  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`${method} ${path} failed (${res.status}): ${data.error || data.message || res.statusText}`);
  }
}

/**
 * Delete an evaluation by ID.
 * Note: evaluations can only be deleted in borrador status.
 */
export async function deleteEvaluationById(id: string, token: string): Promise<void> {
  try {
    await apiRequest({ method: 'DELETE', path: `/api/evaluations/evaluations/${id}`, token });
  } catch {
    // Evaluations in non-borrador status cannot be deleted — skip cleanup error
  }
}

/**
 * Delete an action by ID.
 */
export async function deleteActionById(id: string, token: string): Promise<void> {
  await apiRequest({ method: 'DELETE', path: `/api/evaluations/actions/${id}`, token });
}

/**
 * Delete a user by ID.
 */
export async function deleteUserById(id: string, token: string): Promise<void> {
  await apiRequest({ method: 'DELETE', path: `/api/users/users/${id}`, token });
}

/**
 * Delete an indicator value for a given evaluation + indicator.
 */
export async function deleteIndicatorValue(
  evaluationId: string,
  indicatorId: string,
  token: string,
): Promise<void> {
  await apiRequest({
    method: 'DELETE',
    path: `/api/evaluations/evaluations/${evaluationId}/indicators/${indicatorId}/value`,
    token,
  });
}

// ── Generic lookup helpers ─────────────────────────────────────────────────

interface ApiListOptions {
  path: string;
  token: string;
  key?: string;
}

async function apiList({ path, token }: ApiListOptions): Promise<any[]> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    const data = await res.json().catch(() => ({}));
    throw new Error(`GET ${path} failed (${res.status}): ${data.error || data.message || res.statusText}`);
  }

  const data = await res.json().catch(() => ({}));
  const list = Array.isArray(data) ? data : data?.items || data?.Items || [];
  return list || [];
}

function normalizeId(item: any): string | undefined {
  return item?.id || item?.ID;
}

// ── User cleanup by email ──────────────────────────────────────────────────

export async function deleteUserByEmail(email: string, token: string): Promise<void> {
  const users = await apiList({ path: '/api/users/users', token });
  const user = users.find((u: any) => u.email === email || u.Email === email);
  const id = normalizeId(user);
  if (!id) return;
  await deleteUserById(id, token);
}

// ── Destination cleanup by name ────────────────────────────────────────────

export async function deleteDestinationById(id: string, token: string): Promise<void> {
  await apiRequest({ method: 'DELETE', path: `/api/evaluations/destinations/${id}`, token });
}

export async function deleteDestinationByName(name: string, token: string): Promise<void> {
  const destinations = await apiList({ path: '/api/evaluations/destinations', token });
  const destination = destinations.find((d: any) => d.name === name || d.Name === name);
  const id = normalizeId(destination);
  if (!id) return;
  await deleteDestinationById(id, token);
}

// ── Scope cleanup by acronym ───────────────────────────────────────────────

export async function deleteScopeById(id: string, token: string): Promise<void> {
  await apiRequest({ method: 'DELETE', path: `/api/evaluations/admin/scopes/${id}`, token });
}

export async function deleteScopeByAcronym(acronym: string, token: string): Promise<void> {
  const scopes = await apiList({ path: '/api/evaluations/admin/scopes', token });
  const scope = scopes.find((s: any) => s.acronym === acronym || s.Acronym === acronym);
  const id = normalizeId(scope);
  if (!id) return;
  await deleteScopeById(id, token);
}

// ── Indicator cleanup by code ──────────────────────────────────────────────

export async function deleteIndicatorById(id: string, token: string): Promise<void> {
  await apiRequest({ method: 'DELETE', path: `/api/evaluations/admin/indicators/${id}`, token });
}

export async function deleteIndicatorByCode(code: string, token: string): Promise<void> {
  const indicators = await apiList({ path: '/api/evaluations/admin/indicators', token });
  const indicator = indicators.find((i: any) => i.code === code || i.Code === code);
  const id = normalizeId(indicator);
  if (!id) return;
  await deleteIndicatorById(id, token);
}

// ── Catalog helpers ────────────────────────────────────────────────────────

export async function getAdminRequirements(token: string): Promise<any[]> {
  return apiList({ path: '/api/evaluations/admin/requirements', token });
}
