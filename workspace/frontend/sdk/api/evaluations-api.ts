// Evaluations Service API Client — BFF Pattern
// ALL requests go through the Next.js BFF (rewrites on client-side, api-gateway on server-side).
// NEVER call services directly — always through api-gateway.

import type {
  Evaluation, EvaluationUser, Indicator, IndicatorValue, SaveDestinationValueResponse,
  IndicatorMessage, IndicatorHistory, Action, ActionEvidence,
  ActionIndicatorLink, GoodPractice, DtiPlan, DtiPlanGoal,
  Scope, Requirement, ScopeProgress, ResultsData, GoodPracticePublic,
  SubnationalLevel, DestinationTypology, PopulationRange, Region,
  MemberType, ResponsibleArea, AxisLevel, Destination, EvaluationType,
  EvaluationStatus, ActionStatus, AccessLevel,
  IndicatorLink, Informe, PaginatedEvaluations,
  ActionTranslation, ODSItem,
} from '@/types';
import { getCurrentLocale } from './locale';

const IS_SERVER = typeof window === 'undefined';

/**
 * BFF base URL strategy:
 * - Client-side: relative path → Next.js rewrites → api-gateway (port 8080)
 * - Server-side: api-gateway internal URL (port 8080)
 * NEVER call evaluations-service (port 8082) directly.
 */
function getBaseUrl(): string {
  if (IS_SERVER) {
    // Server-side (SSR/Route Handlers): call api-gateway internally
    return process.env.INTERNAL_GATEWAY_URL || 'http://localhost:8080';
  }
  // Client-side: Next.js rewrites /api/* → api-gateway
  return '/api/evaluations';
}

function getPublicBaseUrl(): string {
  if (IS_SERVER) {
    return process.env.INTERNAL_GATEWAY_URL || 'http://localhost:8080';
  }
  // Same as getBaseUrl() — gateway routes are all under /api/evaluations/...
  return '/api/evaluations';
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (IS_SERVER) {
    // Server-side: auth is handled by middleware via httpOnly cookie (auto_insight_token)
    // No need to set Authorization header — the middleware validates the cookie
    // and the api-gateway receives the forwarded headers
    return headers;
  }

  // Client-side: read JWT from localStorage, send as Bearer token
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const baseUrl = getBaseUrl();
  const headers = getAuthHeaders();

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    if (!IS_SERVER) window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (res.status === 422) {
    const errBody = await res.json();
    const error = new Error(errBody.error || 'Validation error') as any;
    error.status = 422;
    error.allowed_transitions = errBody.allowed_transitions;
    throw error;
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const serverMsg = errBody.error || errBody.message || '';
    const error = new Error(serverMsg || `${method} ${path} failed: ${res.status}`) as any;
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function publicRequest<T>(method: string, path: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const baseUrl = getPublicBaseUrl();

  const res = await fetch(`${baseUrl}${path}`, { method, headers });

  if (!res.ok) {
    throw new Error(`${method} ${path} failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ========== Destinations ==========

export async function getDestinations(): Promise<Destination[]> {
  return request('GET', '/destinations');
}

export async function getDestination(id: string): Promise<Destination> {
  return request('GET', `/destinations/${id}`);
}

export async function createDestination(data: Partial<Destination>): Promise<Destination> {
  return request('POST', '/destinations', data);
}

export async function updateDestination(id: string, data: Partial<Destination>): Promise<Destination> {
  return request('PUT', `/destinations/${id}`, data);
}

// ========== Evaluations ==========

export async function getEvaluations(filters?: {
  destination_id?: string;
  type?: EvaluationType;
  status?: EvaluationStatus;
  limit?: number;
  offset?: number;
}): Promise<PaginatedEvaluations> {
  const params = new URLSearchParams();
  if (filters?.destination_id) params.set('destination_id', filters.destination_id);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters?.offset !== undefined) params.set('offset', String(filters.offset));
  const qs = params.toString();
  return request('GET', `/evaluations${qs ? `?${qs}` : ''}`);
}

export async function getEvaluation(id: string): Promise<Evaluation> {
  return request('GET', `/evaluations/${id}`);
}

export async function createEvaluation(data: {
  destination_id: string;
  name: string;
  type: EvaluationType;
  start_date?: string;
  end_date?: string;
  has_external_evaluator?: boolean;
}): Promise<Evaluation> {
  return request('POST', '/evaluations', data);
}

export async function updateEvaluation(id: string, data: Partial<{
  name: string;
  start_date: string;
  end_date: string;
  has_external_evaluator: boolean;
}>): Promise<Evaluation> {
  return request('PUT', `/evaluations/${id}`, data);
}

export async function deleteEvaluation(id: string): Promise<void> {
  return request('DELETE', `/evaluations/${id}`);
}

export async function changeEvaluationStatus(id: string, newStatus: EvaluationStatus): Promise<Evaluation> {
  return request('POST', `/evaluations/${id}/change-status`, { status: newStatus });
}

export async function promoteEvaluation(id: string, targetType: EvaluationType): Promise<Evaluation> {
  return request('POST', `/evaluations/${id}/promote`, { type: targetType });
}

// ========== Evaluation Users ==========

export async function getEvaluationUsers(evaluationId: string): Promise<EvaluationUser[]> {
  return request('GET', `/evaluations/${evaluationId}/users`);
}

export async function grantEvaluationAccess(evaluationId: string, userId: string, accessLevel: AccessLevel): Promise<void> {
  return request('POST', `/evaluations/${evaluationId}/users`, { user_id: userId, access_level: accessLevel });
}

export async function revokeEvaluationAccess(evaluationId: string, userId: string): Promise<void> {
  return request('DELETE', `/evaluations/${evaluationId}/users/${userId}`);
}

export async function getScopeProgress(evaluationId: string, locale?: string): Promise<ScopeProgress[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return request('GET', `/evaluations/${evaluationId}/scopes/progress${qs}`);
}

// ========== Scopes & Requirements ==========

export async function getScopes(locale?: string): Promise<Scope[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return request('GET', `/scopes${qs}`);
}

export async function getRequirements(scopeId?: string, locale?: string): Promise<Requirement[]> {
  const l = locale || getCurrentLocale();
  const params = new URLSearchParams();
  if (scopeId) params.set('scope_id', scopeId);
  if (l) params.set('locale', l);
  const qs = params.toString();
  return request('GET', `/requirements${qs ? `?${qs}` : ''}`);
}

// ========== Indicators ==========

export async function getScopeIndicators(evaluationId: string, scopeId: string, locale?: string): Promise<Indicator[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return request('GET', `/evaluations/${evaluationId}/scopes/${scopeId}/indicators${qs}`);
}

/**
 * @deprecated Este endpoint no existe en el backend.
 * Usá getScopeIndicators() o getAdminIndicators().
 */
export async function getIndicator(id: string, locale?: string): Promise<Indicator> {
  try {
    const l = locale || getCurrentLocale();
    const qs = l ? `?locale=${l}` : '';
    return await request('GET', `/indicators/${id}${qs}`);
  } catch {
    const all = await getAdminIndicators();
    const found = all.find((i: Indicator) => i.id === id);
    if (!found) throw new Error(`Indicator ${id} not found`);
    return found;
  }
}

export async function getIndicatorValue(evaluationId: string, indicatorId: string): Promise<IndicatorValue> {
  return request('GET', `/evaluations/${evaluationId}/indicators/${indicatorId}/value`);
}

export async function saveDestinationValue(evaluationId: string, indicatorId: string, data: {
  destination_value?: number;
  meta?: number;
  meta_date?: string;
  destination_observations?: string;
}): Promise<SaveDestinationValueResponse> {
  return request('PUT', `/evaluations/${evaluationId}/indicators/${indicatorId}/value`, data);
}

export async function saveEvaluatorValue(evaluationId: string, indicatorId: string, data: {
  evaluator_value?: number;
  evaluator_observations?: string;
}): Promise<IndicatorValue> {
  return request('PUT', `/evaluations/${evaluationId}/indicators/${indicatorId}/evaluator`, data);
}

export async function deleteIndicatorValue(evaluationId: string, indicatorId: string): Promise<void> {
  return request('DELETE', `/evaluations/${evaluationId}/indicators/${indicatorId}/value`);
}

export async function triggerAiAnalysis(indicatorId: string): Promise<void> {
  return request('POST', `/indicators/${indicatorId}/analyze`);
}

// ========== Messages ==========

export async function getIndicatorMessages(indicatorValueId: string): Promise<IndicatorMessage[]> {
  return request('GET', `/indicators/${indicatorValueId}/messages`);
}

export async function sendIndicatorMessage(indicatorValueId: string, message: string): Promise<IndicatorMessage> {
  return request('POST', `/indicators/${indicatorValueId}/messages`, { message });
}

// ========== Actions ==========

export async function getActions(params?: { destinationId?: string; scopeId?: string } | string): Promise<Action[]> {
  // Support legacy string call: getActions(destinationId)
  if (typeof params === 'string') {
    const qs = params ? `?destination_id=${params}` : '';
    return (await request<Action[] | undefined>('GET', `/actions${qs}`)) ?? [];
  }
  const searchParams = new URLSearchParams();
  if (params?.destinationId) searchParams.set('destination_id', params.destinationId);
  if (params?.scopeId) searchParams.set('scope_id', params.scopeId);
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return (await request<Action[] | undefined>('GET', `/actions${qs}`)) ?? [];
}

export async function getAction(id: string): Promise<Action> {
  return request('GET', `/actions/${id}`);
}

export async function createAction(data: Partial<Action> & { destination_id: string; name: string }): Promise<Action> {
  return request('POST', '/actions', data);
}

export async function updateAction(id: string, data: Partial<Action>): Promise<Action> {
  return request('PUT', `/actions/${id}`, data);
}

export async function deleteAction(id: string): Promise<void> {
  return request('DELETE', `/actions/${id}`);
}

export async function linkIndicatorToAction(actionId: string, indicatorId: string, evaluationId: string): Promise<void> {
  return request('POST', `/actions/${actionId}/link-indicator`, { indicator_id: indicatorId, evaluation_id: evaluationId });
}

export async function unlinkIndicatorFromAction(actionId: string, indicatorId: string, evaluationId: string): Promise<void> {
  return request('DELETE', `/actions/${actionId}/unlink-indicator/${indicatorId}/${evaluationId}`);
}

// ========== Action Evidence ==========

export async function addEvidence(actionId: string, evaluationId: string, type: string, url?: string, filePath?: string): Promise<ActionEvidence> {
  return request('POST', `/actions/${actionId}/evidence`, {
    evaluation_id: evaluationId,
    type,
    ...(url !== undefined ? { url } : {}),
    ...(filePath !== undefined ? { file_path: filePath } : {}),
  });
}

export async function getEvidence(actionId: string): Promise<ActionEvidence[]> {
  return request('GET', `/actions/${actionId}/evidence`);
}

export async function uploadFile(actionId: string, evaluationId: string, file: File): Promise<ActionEvidence> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('actionId', actionId);
  formData.append('evaluationId', evaluationId);

  const baseUrl = IS_SERVER
    ? (process.env.INTERNAL_GATEWAY_URL || 'http://localhost:8080')
    : '';

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Upload failed: ${res.status}`);
  }

  return res.json();
}

export async function deleteEvidence(actionId: string, evidenceId: string): Promise<void> {
  return request('DELETE', `/actions/${actionId}/evidence/${evidenceId}`);
}

// ========== Notifications ==========

export async function notifyDestination(evaluationId: string): Promise<void> {
  return request('POST', `/evaluations/${evaluationId}/notify-destination`);
}

// ========== Good Practices ==========

export async function designateGoodPractice(actionId: string): Promise<GoodPractice> {
  return request('PUT', `/actions/${actionId}/designate-good-practice`);
}

export async function approveGoodPractice(actionId: string): Promise<GoodPractice> {
  return request('PUT', `/actions/${actionId}/approve-good-practice`);
}

export async function rejectGoodPractice(actionId: string): Promise<GoodPractice> {
  return request('PUT', `/actions/${actionId}/approve-good-practice`, { reject: true });
}

// ========== DTI Plans ==========

export async function getDtiPlans(destinationId?: string): Promise<DtiPlan[]> {
  const qs = destinationId ? `?destination_id=${destinationId}` : '';
  return request('GET', `/dti-plans${qs}`);
}

export async function getDtiPlan(id: string): Promise<DtiPlan> {
  return request('GET', `/dti-plans/${id}`);
}

export async function createDtiPlan(data: {
  destination_id: string;
  name: string;
  start_date: string;
  end_date: string;
}): Promise<DtiPlan> {
  return request('POST', '/dti-plans', data);
}

export async function updateDtiPlan(id: string, data: Partial<DtiPlan>): Promise<DtiPlan> {
  return request('PUT', `/dti-plans/${id}`, data);
}

export async function deleteDtiPlan(id: string): Promise<void> {
  return request('DELETE', `/dti-plans/${id}`);
}

// ========== DTI Plan Goals ==========

export async function addDtiPlanGoal(dtiPlanId: string, data: {
  indicator_id: string;
  target_score: number;
  target_date?: string;
}): Promise<DtiPlanGoal> {
  return request('POST', `/dti-plans/${dtiPlanId}/goals`, data);
}

export async function updateDtiPlanGoal(dtiPlanId: string, goalId: string, data: Partial<DtiPlanGoal>): Promise<DtiPlanGoal> {
  return request('PUT', `/dti-plans/${dtiPlanId}/goals/${goalId}`, data);
}

// ========== Results ==========

export async function getResults(filters?: {
  scope_id?: string;
  axis?: string;
  country?: string;
  typology_id?: string;
  member_type_id?: string;
  destination_id?: string;
  year?: number;
}): Promise<ResultsData[]> {
  const params = new URLSearchParams();
  if (filters?.scope_id) params.set('scope_id', filters.scope_id);
  if (filters?.axis) params.set('axis', filters.axis);
  if (filters?.country) params.set('country', filters.country);
  if (filters?.typology_id) params.set('typology_id', filters.typology_id);
  if (filters?.member_type_id) params.set('member_type_id', filters.member_type_id);
  if (filters?.destination_id) params.set('destination_id', filters.destination_id);
  if (filters?.year) params.set('year', String(filters.year));
  const qs = params.toString();
  return request('GET', `/results${qs ? `?${qs}` : ''}`);
}

// ========== Informes ==========

export async function getInformes(): Promise<Informe[]> {
  return request('GET', '/informes');
}

export async function getInforme(id: string): Promise<Informe> {
  return request('GET', `/informes/${id}`);
}

// ========== Public ==========

export async function getGoodPractice(id: string, locale?: string): Promise<GoodPracticePublic> {
  const qs = locale ? `?locale=${locale}` : '';
  return publicRequest('GET', `/public/good-practices/${id}${qs}`);
}

export async function getGoodPractices(filters?: {
  scope_id?: string;
  axis?: string;
  country?: string;
  locale?: string;
}): Promise<GoodPracticePublic[]> {
  const params = new URLSearchParams();
  if (filters?.scope_id) params.set('scope_id', filters.scope_id);
  if (filters?.axis) params.set('axis', filters.axis);
  if (filters?.country) params.set('country', filters.country);
  if (filters?.locale) params.set('locale', filters.locale);
  const qs = params.toString();
  return publicRequest('GET', `/public/good-practices${qs ? `?${qs}` : ''}`);
}

// ========== Content Translations Admin ==========

export async function getContentTranslations(filters?: {
  locale?: string;
  reviewed?: boolean;
}): Promise<ActionTranslation[]> {
  const params = new URLSearchParams();
  if (filters?.locale) params.set('locale', filters.locale);
  if (filters?.reviewed !== undefined) params.set('reviewed', String(filters.reviewed));
  const qs = params.toString();
  return request('GET', `/admin/translations/content${qs ? `?${qs}` : ''}`);
}

export async function getContentTranslation(id: string): Promise<ActionTranslation> {
  return request('GET', `/admin/translations/content/${id}`);
}

export async function reviewContentTranslation(id: string, data: {
  name?: string;
  summary?: string;
  description?: string;
  ods?: ODSItem[];
}): Promise<ActionTranslation> {
  return request('PUT', `/admin/translations/content/${id}`, data);
}

// ========== Public Catalogs (no auth) ==========

export async function getPublicScopes(locale?: string): Promise<Scope[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return publicRequest('GET', `/public/scopes${qs}`);
}

export async function getPublicDestinations(): Promise<Destination[]> {
  return publicRequest('GET', '/public/destinations');
}

export async function getPublicSubnationalLevels(locale?: string): Promise<SubnationalLevel[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return publicRequest('GET', `/public/subnational-levels${qs}`);
}

export async function getPublicTypologies(locale?: string): Promise<DestinationTypology[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return publicRequest('GET', `/public/typologies${qs}`);
}

// ========== Admin Catalogs ==========

export async function getSubnationalLevels(locale?: string): Promise<SubnationalLevel[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return request('GET', `/admin/subnational-levels${qs}`);
}

export async function createSubnationalLevel(data: Partial<SubnationalLevel>): Promise<SubnationalLevel> {
  return request('POST', '/admin/subnational-levels', data);
}

export async function updateSubnationalLevel(id: string, data: Partial<SubnationalLevel>): Promise<SubnationalLevel> {
  return request('PUT', `/admin/subnational-levels/${id}`, data);
}

export async function deleteSubnationalLevel(id: string): Promise<void> {
  return request('DELETE', `/admin/subnational-levels/${id}`);
}

export async function getTypologies(locale?: string): Promise<DestinationTypology[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return request('GET', `/admin/typologies${qs}`);
}

export async function createTypology(data: Partial<DestinationTypology>): Promise<DestinationTypology> {
  return request('POST', '/admin/typologies', data);
}

export async function updateTypology(id: string, data: Partial<DestinationTypology>): Promise<DestinationTypology> {
  return request('PUT', `/admin/typologies/${id}`, data);
}

export async function deleteTypology(id: string): Promise<void> {
  return request('DELETE', `/admin/typologies/${id}`);
}

export async function getPopulationRanges(locale?: string): Promise<PopulationRange[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return request('GET', `/admin/population-ranges${qs}`);
}

export async function createPopulationRange(data: Partial<PopulationRange>): Promise<PopulationRange> {
  return request('POST', '/admin/population-ranges', data);
}

export async function updatePopulationRange(id: string, data: Partial<PopulationRange>): Promise<PopulationRange> {
  return request('PUT', `/admin/population-ranges/${id}`, data);
}

export async function deletePopulationRange(id: string): Promise<void> {
  return request('DELETE', `/admin/population-ranges/${id}`);
}

export async function getRegions(locale?: string): Promise<Region[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return request('GET', `/admin/regions${qs}`);
}

export async function createRegion(data: Partial<Region>): Promise<Region> {
  return request('POST', '/admin/regions', data);
}

export async function updateRegion(id: string, data: Partial<Region>): Promise<Region> {
  return request('PUT', `/admin/regions/${id}`, data);
}

export async function deleteRegion(id: string): Promise<void> {
  return request('DELETE', `/admin/regions/${id}`);
}

export async function getMemberTypes(locale?: string): Promise<MemberType[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return request('GET', `/admin/member-types${qs}`);
}

export async function createMemberType(data: Partial<MemberType>): Promise<MemberType> {
  return request('POST', '/admin/member-types', data);
}

export async function updateMemberType(id: string, data: Partial<MemberType>): Promise<MemberType> {
  return request('PUT', `/admin/member-types/${id}`, data);
}

export async function deleteMemberType(id: string): Promise<void> {
  return request('DELETE', `/admin/member-types/${id}`);
}

export async function getResponsibleAreas(locale?: string): Promise<ResponsibleArea[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return request('GET', `/admin/responsible-areas${qs}`);
}

export async function createResponsibleArea(data: Partial<ResponsibleArea>): Promise<ResponsibleArea> {
  return request('POST', '/admin/responsible-areas', data);
}

export async function updateResponsibleArea(id: string, data: Partial<ResponsibleArea>): Promise<ResponsibleArea> {
  return request('PUT', `/admin/responsible-areas/${id}`, data);
}

export async function deleteResponsibleArea(id: string): Promise<void> {
  return request('DELETE', `/admin/responsible-areas/${id}`);
}

export async function getAxes(): Promise<AxisLevel[]> {
  return request('GET', '/admin/axes');
}

export async function updateAxis(id: string, data: Partial<AxisLevel>): Promise<AxisLevel> {
  return request('PUT', `/admin/axes/${id}`, data);
}

export async function getAdminScopes(locale?: string): Promise<Scope[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return request('GET', `/admin/scopes${qs}`);
}

export async function createAdminScope(data: Partial<Scope>): Promise<Scope> {
  return request('POST', '/admin/scopes', data);
}

export async function updateAdminScope(id: string, data: Partial<Scope>): Promise<Scope> {
  return request('PUT', `/admin/scopes/${id}`, data);
}

export async function getAdminRequirements(locale?: string): Promise<Requirement[]> {
  const l = locale || getCurrentLocale();
  const params = new URLSearchParams();
  if (l) params.set('locale', l);
  const qs = params.toString();
  return request('GET', `/admin/requirements${qs ? `?${qs}` : ''}`);
}

export async function createAdminRequirement(data: Partial<Requirement>): Promise<Requirement> {
  return request('POST', '/admin/requirements', data);
}

export async function updateAdminRequirement(id: string, data: Partial<Requirement>): Promise<Requirement> {
  return request('PUT', `/admin/requirements/${id}`, data);
}

export async function getAdminIndicators(locale?: string): Promise<Indicator[]> {
  const l = locale || getCurrentLocale();
  const qs = l ? `?locale=${l}` : '';
  return request('GET', `/admin/indicators${qs}`);
}

export async function createAdminIndicator(data: Partial<Indicator>): Promise<Indicator> {
  return request('POST', '/admin/indicators', data);
}

export async function updateAdminIndicator(id: string, data: Partial<Indicator>): Promise<Indicator> {
  return request('PUT', `/admin/indicators/${id}`, data);
}

export async function deleteDestination(id: string): Promise<void> {
  return request('DELETE', `/destinations/${id}`);
}

export async function deleteAxis(id: string): Promise<void> {
  return request('DELETE', `/admin/axes/${id}`);
}

export async function deleteAdminScope(id: string): Promise<void> {
  return request('DELETE', `/admin/scopes/${id}`);
}

export async function deleteAdminRequirement(id: string): Promise<void> {
  return request('DELETE', `/admin/requirements/${id}`);
}

export async function deleteAdminIndicator(id: string): Promise<void> {
  return request('DELETE', `/admin/indicators/${id}`);
}
