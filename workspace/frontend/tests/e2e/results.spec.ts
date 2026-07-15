import { test as base, expect } from '@playwright/test';
import { seed } from './fixtures/seed';
import { LoginPage } from './pages/LoginPage';
import { ResultsPage } from './pages/ResultsPage';

const API_URL = process.env.API_URL || 'http://localhost:8080';
const AUTH_FILE = 'e2e-auth-results.json';

interface ApiResponse {
  id?: string;
  ID?: string;
  name?: string;
  Name?: string;
  acronym?: string;
  Acronym?: string;
  code?: string;
  Code?: string;
  type?: string;
  Type?: string;
  items?: unknown[];
  Items?: unknown[];
  data?: unknown[];
  [key: string]: unknown;
}

async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<ApiResponse | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status}): ${data.error || data.message || res.statusText}`);
  }
  return data as ApiResponse;
}

function extractId(item: ApiResponse | null): string {
  if (!item) throw new Error('Expected API response but got null');
  return (item.id || item.ID) as string;
}

function extractItems(res: ApiResponse | null): ApiResponse[] {
  if (!res) return [];
  const list = Array.isArray(res) ? res : (res.items || res.Items || res.data || []);
  return list as ApiResponse[];
}

async function changeEvaluationStatus(token: string, evaluationId: string, status: string) {
  await apiRequest(
    'POST',
    `/api/evaluations/evaluations/${evaluationId}/change-status`,
    { status },
    token,
  );
}

async function closeEvaluation(token: string, evaluationId: string) {
  await changeEvaluationStatus(token, evaluationId, 'en_curso');
  await changeEvaluationStatus(token, evaluationId, 'carga_finalizada');
  await changeEvaluationStatus(token, evaluationId, 'en_evaluacion');
  await changeEvaluationStatus(token, evaluationId, 'cerrada');
}

// ── Shared auth context ────────────────────────────────────────────────────

const test = base.extend({
  context: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_FILE });
    await use(ctx);
    await ctx.close();
  },
  page: async ({ context }, use) => {
    const pg = await context.newPage();
    await use(pg);
  },
});

// ── Tests ───────────────────────────────────────────────────────────────────

test.describe('Results (HU-18)', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken = '';
  let destinosMemberTypeId = '';
  let ejemploMemberTypeId = '';
  let selectedScopeLabel = '';
  let destinosDestinationName = '';
  let ejemploDestinationName = '';

  test.beforeAll(async ({ browser }) => {
    const seedResult = await seed();
    adminToken = seedResult.adminToken;

    // Log in via UI and persist storage state for the spec.
    const ctx = await browser.newContext();
    const pg = await ctx.newPage();
    const loginPage = new LoginPage(pg);
    await loginPage.goto();
    await loginPage.loginAs('admin');
    await ctx.storageState({ path: AUTH_FILE });
    await ctx.close();

    // ── Resolve member types ───────────────────────────────────────────────
    const memberTypesRes = await apiRequest('GET', '/api/evaluations/admin/member-types', undefined, adminToken);
    const memberTypes = extractItems(memberTypesRes);
    const destinosType = memberTypes.find((mt) => mt.name === 'Destinos' || mt.Name === 'Destinos');
    const ejemploType = memberTypes.find((mt) => mt.name === 'Ejemplo' || mt.Name === 'Ejemplo');
    if (!destinosType || !ejemploType) {
      throw new Error(`Member types not found. Available: ${memberTypes.map((mt) => mt.name || mt.Name).join(', ')}`);
    }
    destinosMemberTypeId = extractId(destinosType);
    ejemploMemberTypeId = extractId(ejemploType);

    // ── Resolve a stable scope and a few of its indicators ─────────────────
    const scopesRes = await apiRequest('GET', '/api/evaluations/scopes', undefined, adminToken);
    const scopes = extractItems(scopesRes);
    const orgScope = scopes.find((s) => (s.acronym || s.Acronym) === 'ORG');
    if (!orgScope) {
      throw new Error(`Scope ORG not found. Available: ${scopes.map((s) => s.acronym || s.Acronym).join(', ')}`);
    }
    const scopeName = (orgScope.name || orgScope.Name) as string;
    selectedScopeLabel = `ORG — ${scopeName}`;

    const indicatorsRes = await apiRequest('GET', '/api/evaluations/admin/indicators', undefined, adminToken);
    const indicators = extractItems(indicatorsRes);
    const orgIndicators = indicators
      .filter((ind) => {
        const code = ind.code || ind.Code;
        const type = ind.type || ind.Type;
        return typeof code === 'string' && code.includes('_ORG_') && type === 'gradient';
      })
      .slice(0, 5);
    if (orgIndicators.length === 0) {
      throw new Error('No ORG scope indicators found');
    }

    // ── Create test destinations and closed evaluations ────────────────────
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    destinosDestinationName = `E2E Resultados Destinos ${timestamp}`;
    ejemploDestinationName = `E2E Resultados Ejemplo ${timestamp}`;

    async function createResultDestination(
      name: string,
      memberTypeId: string,
    ): Promise<string> {
      const dest = await apiRequest(
        'POST',
        '/api/evaluations/destinations',
        {
          name,
          country: 'Argentina',
          member_type_id: memberTypeId,
          is_adhered: true,
        },
        adminToken,
      );
      return extractId(dest);
    }

    async function createClosedEvaluation(
      destinationId: string,
      name: string,
      value: number,
    ): Promise<void> {
      const evalRes = await apiRequest(
        'POST',
        '/api/evaluations/evaluations',
        {
          destination_id: destinationId,
          name,
          type: 'autodiagnostico',
          start_date: `${year}-01-01`,
          end_date: `${year}-12-31`,
        },
        adminToken,
      );
      const evalId = extractId(evalRes);

      // Values can only be written while the evaluation is en_curso.
      await changeEvaluationStatus(adminToken, evalId, 'en_curso');

      for (const ind of orgIndicators) {
        const indId = extractId(ind);
        await apiRequest(
          'PUT',
          `/api/evaluations/evaluations/${evalId}/indicators/${indId}/value`,
          { destination_value: value },
          adminToken,
        );
      }

      await changeEvaluationStatus(adminToken, evalId, 'carga_finalizada');
      await changeEvaluationStatus(adminToken, evalId, 'en_evaluacion');
      await changeEvaluationStatus(adminToken, evalId, 'cerrada');
    }

    const destinosDestinationId = await createResultDestination(destinosDestinationName, destinosMemberTypeId);
    await createClosedEvaluation(destinosDestinationId, `E2E Evaluación Destinos ${timestamp}`, 75);

    const ejemploDestinationId = await createResultDestination(ejemploDestinationName, ejemploMemberTypeId);
    await createClosedEvaluation(ejemploDestinationId, `E2E Evaluación Ejemplo ${timestamp}`, 50);
  });

  test.beforeEach(async ({ page }) => {
    // Warming the page so the SWR catalog requests have time to populate the filters.
    await page.goto('/resultados');
    await page.waitForSelector('h1:has-text("Resultados")', { state: 'visible' });
    await page.waitForLoadState('networkidle');
  });

  test('Compare Destinos results excluding examples', async ({ page }) => {
    const resultsPage = new ResultsPage(page);

    await resultsPage.selectYear(new Date().getFullYear().toString());
    await resultsPage.selectScope(selectedScopeLabel);
    await resultsPage.selectMemberType('Destinos');
    await resultsPage.clickBuscar();

    await expect(resultsPage.getSummaryCards()).toHaveCount(3);
    await expect(resultsPage.getDetailTable()).toBeVisible();
    await expect(resultsPage.getCharts()).toBeVisible();

    const names = await resultsPage.getDestinationNames();
    expect(names).toContain(destinosDestinationName);
    expect(names).not.toContain(ejemploDestinationName);
  });

  test('Include Ejemplo destinations', async ({ page }) => {
    const resultsPage = new ResultsPage(page);

    await resultsPage.selectYear(new Date().getFullYear().toString());
    await resultsPage.selectScope(selectedScopeLabel);
    await resultsPage.selectMemberType('Ejemplo');
    await resultsPage.clickBuscar();

    await expect(resultsPage.getDetailTable()).toBeVisible();

    const names = await resultsPage.getDestinationNames();
    expect(names).toContain(ejemploDestinationName);
    expect(names).not.toContain(destinosDestinationName);
  });
});
