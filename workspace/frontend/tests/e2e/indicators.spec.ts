import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { EvaluationDetailPage } from './pages/EvaluationDetailPage';
import { IndicatorPage, type GradientValue, type BooleanValue } from './pages/IndicatorPage';
import { seed } from './fixtures/seed';
import { deleteEvaluationById, deleteIndicatorValue } from './fixtures/cleanup';
import type { Indicator, ScopeProgress, Evaluation } from '../../types/dti';

// ── Configuration ───────────────────────────────────────────────────────────

const API_URL = process.env.API_URL || 'http://localhost:8080';
const AUTH_FILE = 'tests/e2e/.auth/e2e-auth-admin-indicators.json';

// ── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch(
  path: string,
  token: string,
  options: { method?: string; body?: unknown } = {}
): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `${options.method || 'GET'} ${path} failed (${res.status}): ${data.error || data.message || res.statusText}`
    );
  }
  return data;
}

async function createEvaluationViaApi(token: string, destinationId: string): Promise<Evaluation> {
  const name = `E2E Indicators ${Date.now()}`;
  const evaluation = await apiFetch('/api/evaluations/evaluations', token, {
    method: 'POST',
    body: {
      destination_id: destinationId,
      name,
      type: 'autodiagnostico',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      has_external_evaluator: false,
    },
  });

  // Destination values can only be written once the evaluation is in progress.
  await apiFetch(`/api/evaluations/evaluations/${evaluation.id}/change-status`, token, {
    method: 'POST',
    body: { status: 'en_curso' },
  });

  return apiFetch(`/api/evaluations/evaluations/${evaluation.id}`, token);
}

async function getScopeProgress(token: string, evaluationId: string): Promise<ScopeProgress[]> {
  return apiFetch(`/api/evaluations/evaluations/${evaluationId}/scopes`, token);
}

async function getScopeIndicators(token: string, evaluationId: string, scopeId: string): Promise<Indicator[]> {
  return apiFetch(`/api/evaluations/evaluations/${evaluationId}/scopes/${scopeId}/indicators`, token);
}

// ── Shared auth context ─────────────────────────────────────────────────────

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

test.describe('Indicators (HU-09 to HU-13)', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken: string;
  let evaluationId: string;
  let scopeId: string;
  let scopeName: string;
  let gradientIndicator: Indicator;
  let booleanIndicator: Indicator;
  let numericIndicator: Indicator;

  let detailPage: EvaluationDetailPage;
  let indicatorPage: IndicatorPage;

  test.beforeAll(async ({ browser }) => {
    // Seed gives us the admin token and a destination for the evaluation.
    const seedResult = await seed();
    adminToken = seedResult.adminToken;

    // Create a dedicated evaluation for this spec via API (fast and deterministic).
    const evaluation = await createEvaluationViaApi(adminToken, seedResult.testDestinationId);
    evaluationId = evaluation.id;

    // Find a scope that contains at least one indicator of each type.
    const scopes = await getScopeProgress(adminToken, evaluationId);
    if (scopes.length === 0) {
      throw new Error('Evaluation has no scopes');
    }

    let chosenScope: ScopeProgress | null = null;
    let allIndicators: Indicator[] = [];

    for (const scope of scopes) {
      const indicators = await getScopeIndicators(adminToken, evaluationId, scope.scope_id);
      const hasGradient = indicators.some((i) => i.type === 'gradient');
      const hasBoolean = indicators.some((i) => i.type === 'boolean');
      const hasNumeric = indicators.some((i) => i.type === 'numeric');

      if (hasGradient && hasBoolean && hasNumeric) {
        chosenScope = scope;
        allIndicators = indicators;
        break;
      }
    }

    if (!chosenScope) {
      throw new Error('No scope found with gradient, boolean, and numeric indicators');
    }

    scopeId = chosenScope.scope_id;
    scopeName = chosenScope.scope_name;

    gradientIndicator = allIndicators.find((i) => i.type === 'gradient')!;
    booleanIndicator = allIndicators.find((i) => i.type === 'boolean')!;
    numericIndicator = allIndicators.find((i) => i.type === 'numeric')!;

    // Log in through the UI once and persist the storage state.
    const ctx = await browser.newContext();
    const pg = await ctx.newPage();
    const loginPage = new LoginPage(pg);
    await loginPage.goto();
    await loginPage.loginAs('admin');
    await ctx.storageState({ path: AUTH_FILE });
    await ctx.close();
  });

  test.afterAll(async () => {
    if (evaluationId && adminToken) {
      await deleteEvaluationById(evaluationId, adminToken);
    }
  });

  test.beforeEach(async ({ page }) => {
    detailPage = new EvaluationDetailPage(page);
    indicatorPage = new IndicatorPage(page);
  });

  // ── HU-09: View indicators of a scope ──────────────────────────────────
  test('HU-09 — View indicators of a scope', async ({ page }) => {
    await page.goto(`/evaluaciones/${evaluationId}`);
    await page.waitForSelector('h1', { state: 'visible' });

    // Open the Ámbitos tab.
    const ambitosTab = page.locator('button[role="tab"]:has-text("Ámbitos")');
    await ambitosTab.click();
    await page.waitForTimeout(500);

    // Click the chosen scope card.
    const scopeCard = page.locator(`a[href="/evaluaciones/${evaluationId}/ambitos/${scopeId}"]`);
    await scopeCard.click();
    await page.waitForURL(`/evaluaciones/${evaluationId}/ambitos/${scopeId}`, { timeout: 15000 });

    // URL contains both IDs.
    await expect(page).toHaveURL(new RegExp(`/evaluaciones/${evaluationId}/ambitos/${scopeId}`));

    // Table has the expected columns.
    const table = page.locator('#indicators-table');
    await expect(table.locator('th:has-text("Requisito")')).toBeVisible();
    await expect(table.locator('th:has-text("Código")')).toBeVisible();
    await expect(table.locator('th:has-text("Nombre")')).toBeVisible();
    await expect(table.locator('th:has-text("Eje")')).toBeVisible();
    await expect(table.locator('th:has-text("Compl.")')).toBeVisible();
    await expect(table.locator('th:has-text("Valor Destino")')).toBeVisible();
    await expect(table.locator('th:has-text("Valor Eval.")')).toBeVisible();
    await expect(table.locator('th:has-text("Verif.")')).toBeVisible();
    await expect(table.locator('th:has-text("Acciones")')).toBeVisible();

    // At least one row is rendered.
    const rows = indicatorPage.getIndicatorRows();
    await expect(rows.first()).toBeVisible();
  });

  // ── HU-09: Search indicators ───────────────────────────────────────────
  test('HU-09 — Search indicators', async () => {
    await indicatorPage.goto(evaluationId, scopeId);

    const rowsBefore = await indicatorPage.getIndicatorRows().count();
    expect(rowsBefore).toBeGreaterThanOrEqual(3);

    // Search by a unique substring (the numeric indicator name).
    await indicatorPage.searchIndicators(numericIndicator.name);
    const rowsAfterSearch = await indicatorPage.getIndicatorRows().count();
    expect(rowsAfterSearch).toBe(1);

    const visibleText = await indicatorPage.getIndicatorRows().first().textContent();
    expect(visibleText).toContain(numericIndicator.name);

    // Clear the search and assert all rows come back.
    await indicatorPage.searchIndicators('');
    const rowsAfterClear = await indicatorPage.getIndicatorRows().count();
    expect(rowsAfterClear).toBe(rowsBefore);
  });

  // ── HU-10: Edit gradient indicator ─────────────────────────────────────
  test('HU-10 — Edit gradient indicator', async () => {
    await indicatorPage.goto(evaluationId, scopeId);
    await indicatorPage.openIndicatorEdit(gradientIndicator.id);

    await indicatorPage.setGradientValue('50%' as GradientValue);
    await indicatorPage.setObservation('Observación gradiente E2E');
    await indicatorPage.saveValue();

    // Return to the scope table and assert the persisted value.
    await indicatorPage.goto(evaluationId, scopeId);
    const row = indicatorPage.indicatorTable.locator('tr', {
      hasText: gradientIndicator.name,
    });
    await expect(row).toBeVisible();

    const destValueCell = row.locator('td').nth(5);
    await expect(destValueCell).toHaveText('50%');

    // Cumplimentado column shows the completed checkmark.
    const completedCell = row.locator('td').nth(4);
    await expect(completedCell.locator('.text-green-500')).toBeVisible();
  });

  // ── HU-10: Edit boolean indicator ──────────────────────────────────────
  test.skip('HU-10 — Edit boolean indicator', async () => {
    await indicatorPage.goto(evaluationId, scopeId);
    await indicatorPage.openIndicatorEdit(booleanIndicator.id);

    await indicatorPage.setBooleanValue('Sí' as BooleanValue);
    await indicatorPage.saveValue();

    await indicatorPage.goto(evaluationId, scopeId);
    const row = indicatorPage.indicatorTable.locator('tr', {
      hasText: booleanIndicator.name,
    });
    await expect(row).toBeVisible();

    const destValueCell = row.locator('td').nth(5);
    await expect(destValueCell).toHaveText('100');
  });

  // ── HU-10: Edit numeric indicator ──────────────────────────────────────
  test('HU-10 — Edit numeric indicator', async () => {
    await indicatorPage.goto(evaluationId, scopeId);
    await indicatorPage.openIndicatorEdit(numericIndicator.id);

    await indicatorPage.setNumericValue('42');
    await indicatorPage.saveValue();

    await indicatorPage.goto(evaluationId, scopeId);
    const row = indicatorPage.indicatorTable.locator('tr', {
      hasText: numericIndicator.name,
    });
    await expect(row).toBeVisible();

    const destValueCell = row.locator('td').nth(5);
    await expect(destValueCell).toHaveText('42');
  });

  // ── HU-11: View indicator detail ───────────────────────────────────────
  test.skip('HU-11 — View indicator detail', async ({ page }) => {
    // Use the gradient indicator which now has a saved value.
    await indicatorPage.goto(evaluationId, scopeId);
    await indicatorPage.openIndicatorDetail(gradientIndicator.id);

    // Detail page shows the indicator title.
    await expect(page.locator('h1')).toContainText(gradientIndicator.name);

    // Value section is rendered.
    await expect(page.locator('text=Valor — Destino')).toBeVisible();
    await expect(page.locator('text=Valor actual')).toBeVisible();

    // Observations section is rendered.
    await expect(page.locator('text=Observaciones del destino')).toBeVisible();

    // History and messages sections are rendered.
    await expect(page.locator('text=Historial')).toBeVisible();
    await expect(page.locator('text=Mensajes')).toBeVisible();
  });

  // ── HU-12: Delete indicator value ──────────────────────────────────────
  test.skip('HU-12 — Delete indicator value', async () => {
    await indicatorPage.goto(evaluationId, scopeId);

    // Isolate the gradient indicator row before deleting.
    await indicatorPage.searchIndicators(gradientIndicator.name);
    await indicatorPage.deleteValue();

    // After deletion the table refreshes; the value cell should be empty.
    const row = indicatorPage.indicatorTable.locator('tr', {
      hasText: gradientIndicator.name,
    });
    await expect(row).toBeVisible();

    const destValueCell = row.locator('td').nth(5);
    await expect(destValueCell).toHaveText('-');

    // Cumplimentado column should show the incomplete (X) icon.
    const completedCell = row.locator('td').nth(4);
    await expect(completedCell.locator('.text-red-400')).toBeVisible();
  });

  // ── HU-13: Indicator messaging ─────────────────────────────────────────
  test.skip('HU-13 — Indicator messaging', async () => {
    // The boolean indicator has a saved value, so it has an indicatorValueId for messages.
    await indicatorPage.goto(evaluationId, scopeId);
    await indicatorPage.openIndicatorEdit(booleanIndicator.id);

    const messageText = 'Mensaje E2E de seguimiento';
    await indicatorPage.sendMessage(messageText);

    const messages = await indicatorPage.getMessages();
    expect(messages).toContain(messageText);
  });
});
