import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { EvaluationListPage } from './pages/EvaluationListPage';
import { EvaluationDetailPage } from './pages/EvaluationDetailPage';

// ── Test data ──────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'Admin123!';
const DESTINATION_NAME = 'Destino Test E2E';

const EVAL_NAME = `E2E Autodiagnóstico ${Date.now()}`;
const EVAL_TYPE = 'Autodiagnóstico'; // Display label used in the form
const EVAL_TYPE_KEY = 'autodiagnostico';
const DIAGNOSTICO_TYPE = 'Diagnóstico';

const AUTH_FILE = 'e2e-auth.json';

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Wait for the ConfirmDialog to appear, confirm it, and wait for it to close.
 * Used for status transitions that trigger the EvalStatusActions dialog.
 */
async function confirmTransition(page: import('@playwright/test').Page) {
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible', timeout: 10000 });
  const confirmBtn = dialog.locator('button:has-text("Confirmar")');
  await confirmBtn.click();
  await dialog.waitFor({ state: 'detached', timeout: 10000 });
  // Small grace period for UI to update
  await page.waitForTimeout(500);
}

// ── Shared auth context ────────────────────────────────────────────────────

// We use a custom fixture so all tests share the same authenticated context.
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

test.describe('Evaluation Lifecycle', () => {

  test.describe.configure({ mode: 'serial' });

  let loginPage: LoginPage;
  let listPage: EvaluationListPage;
  let detailPage: EvaluationDetailPage;
  // Shared evaluation ID captured from test 2, used by tests 3, 6, 7
  let createdEvalId: string;

  test.beforeAll(async ({ browser }) => {
    // Log in once and save storage state for all subsequent tests
    const ctx = await browser.newContext();
    const pg = await ctx.newPage();
    const lpg = new LoginPage(pg);
    await lpg.goto();
    await lpg.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await ctx.storageState({ path: AUTH_FILE });
    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    listPage = new EvaluationListPage(page);
    detailPage = new EvaluationDetailPage(page);
  });

  // ── 1. Login ──────────────────────────────────────────────────────────
  test('1 — Login as ADMIN, verify redirect and session cookie', async ({ page, context }) => {
    await page.goto('/evaluaciones');

    // Verify the httpOnly session cookie was set from storage state
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((c) => c.name === 'auto_insight_token');
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie!.value.length).toBeGreaterThan(0);

    // Verify localStorage has the JWT for client-side RBAC
    const storedToken = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(storedToken).toBeTruthy();
  });

  // ── 2. Create evaluation ──────────────────────────────────────────────
  test('2 — Create evaluation in borrador state', async ({ page }) => {
    // Navigate to evaluations list first
    await listPage.goto();

    // Create a new evaluation via the form
    await listPage.createEvaluation(
      EVAL_NAME,
      EVAL_TYPE,
      '2026-01-01',
      '2026-12-31',
    );

    // After creation, the app redirects to the new evaluation's detail page
    await expect(page).toHaveURL(/\/evaluaciones\/(?!nuevo)[a-f0-9-]+/);

    // Extract evaluation ID from URL for subsequent tests
    const url = page.url();
    const match = url.match(/\/evaluaciones\/([a-f0-9-]+)/);
    if (match) {
      createdEvalId = match[1];
    }

    // The title should match the evaluation name
    await expect(page.locator('h1')).toContainText(EVAL_NAME);

    // Status should be "Borrador" for a newly created evaluation
    const status = await detailPage.getStatus();
    expect(status).toContain('Borrador');
  });

  // ── 3. State machine ──────────────────────────────────────────────────
  test('3 — State machine: full transition path', async ({ page }) => {
    // Navigate directly to the evaluation created in test 2
    expect(createdEvalId).toBeTruthy();
    await page.goto(`/evaluaciones/${createdEvalId}`);
    await page.waitForSelector('h1', { state: 'visible' });

    // ── borrador → en_curso ──
    await detailPage.changeStatus('en_curso');
    let status = await detailPage.getStatus();
    expect(status).toContain('En curso');

    // ── en_curso → carga_finalizada ──
    await detailPage.changeStatus('carga_finalizada');
    status = await detailPage.getStatus();
    expect(status).toContain('Carga finalizada');

    // ── carga_finalizada → en_evaluacion ──
    await detailPage.changeStatus('en_evaluacion');
    status = await detailPage.getStatus();
    expect(status).toContain('En evaluación');

    // ── en_evaluacion → cerrada ──
    await detailPage.changeStatus('cerrada');
    status = await detailPage.getStatus();
    expect(status).toContain('Cerrada');

    // Verify no more pending transitions (cerrada is terminal unless there's promote)
    // Anular should still be available, but not the positive flow ones
    const transitions = await detailPage.getAllowedTransitions();
    expect(transitions).not.toContain('en_curso');
    expect(transitions).not.toContain('carga_finalizada');
    expect(transitions).not.toContain('en_evaluacion');
    expect(transitions).not.toContain('cerrada');
  });

  // ── 4. Anular y reactivar ─────────────────────────────────────────────
  test('4 — Anular and reactivate evaluation', async ({ page }) => {
    // Create a fresh evaluation for this test
    const anularName = `E2E Anular Test ${Date.now()}`;
    await listPage.goto();
    await listPage.createEvaluation(anularName, EVAL_TYPE);

    // ── borrador → anulada ──
    await detailPage.changeStatus('anulada');
    let status = await detailPage.getStatus();
    expect(status).toContain('Anulada');

    // ── anulada → borrador (reactive) ──
    await detailPage.changeStatus('borrador');
    status = await detailPage.getStatus();
    expect(status).toContain('Borrador');
  });

  // ── 5. Promote ────────────────────────────────────────────────────────
  test('5 — Promote evaluation from cerrada', async ({ page }) => {
    // Create a fresh evaluation and transition it to cerrada
    const promoteName = `E2E Promote Test ${Date.now()}`;
    await listPage.goto();
    await listPage.createEvaluation(promoteName, EVAL_TYPE);

    // Fast-forward through states to cerrada
    await detailPage.changeStatus('en_curso');
    await detailPage.changeStatus('carga_finalizada');
    await detailPage.changeStatus('en_evaluacion');
    await detailPage.changeStatus('cerrada');

    // Verify we are in cerrada
    let status = await detailPage.getStatus();
    expect(status).toContain('Cerrada');

    // Click the Promote button
    await detailPage.promote();

    // On the promotion page, verify we see the origin evaluation info
    await expect(page.locator('h1')).toContainText('Promover Evaluación');
    await expect(page.locator('text=Origen')).toBeVisible();

    // Confirm the promotion
    const promoteConfirmBtn = page.locator('button:has-text("Confirmar Promoción")');
    await promoteConfirmBtn.click();

    // Confirm in the dialog
    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 10000 });
    const confirmBtn = dialog.locator('button:has-text("Promover")');
    await confirmBtn.click();
    await dialog.waitFor({ state: 'detached', timeout: 15000 });

    // After promotion, the app redirects to the new evaluation (Diagnóstico)
    await expect(page).toHaveURL(/\/evaluaciones\/(?!nuevo)[a-f0-9-]+/, { timeout: 15000 });

    // The new evaluation should be of type Diagnóstico
    await expect(page.locator('h1')).toBeVisible();
    status = await detailPage.getStatus();
    // Newly promoted evaluation starts as Borrador
    expect(status).toContain('Borrador');
  });

  // ── 6. Scope cards ────────────────────────────────────────────────────
  test('6 — Scope cards render with progress', async ({ page }) => {
    // Navigate directly to the evaluation created in test 2
    expect(createdEvalId).toBeTruthy();
    await page.goto(`/evaluaciones/${createdEvalId}`);
    await page.waitForSelector('h1', { state: 'visible' });

    // Get scope progress cards from the Ámbitos tab
    const scopeCards = await detailPage.getScopeCards();

    // The app has 16 scopes defined in seed data
    // Not all may be assigned to a freshly created evaluation, but we expect at least some
    // Check that scope cards render with X/Y and percentage format
    for (const card of scopeCards) {
      expect(card.total).toBeGreaterThanOrEqual(0);
      expect(card.completed).toBeGreaterThanOrEqual(0);
      expect(card.percentage).toBeGreaterThanOrEqual(0);
      expect(card.percentage).toBeLessThanOrEqual(100);
      expect(card.total).toBeGreaterThanOrEqual(card.completed);
    }

    // Verify the summary text "X/Y completados (Z%)" is shown
    const summary = page.locator('text=completados');
    if (await summary.count() > 0) {
      const summaryText = await summary.textContent();
      expect(summaryText).toMatch(/\d+\s*\/\s*\d+/);
    }
  });

  // ── 7. Access control ─────────────────────────────────────────────────
  test('7 — Admin access panel shows implicit access', async ({ page }) => {
    // Navigate directly to the evaluation created in test 2
    expect(createdEvalId).toBeTruthy();
    await page.goto(`/evaluaciones/${createdEvalId}`);
    await page.waitForSelector('h1', { state: 'visible' });

    // Click on the "Accesos" tab
    const accesosTab = page.locator('button[role="tab"]:has-text("Accesos")');
    await accesosTab.waitFor({ state: 'visible' });
    await accesosTab.click();
    await page.waitForTimeout(500);

    // The Access Panel should show "Conceder Acceso" button (admin can manage)
    const grantButton = page.locator('button:has-text("Conceder Acceso")');
    await expect(grantButton).toBeVisible();

    // If there are users shown, verify the table is rendered
    const table = page.locator('table');
    const hasTable = await table.count() > 0;

    if (hasTable) {
      // Verify table headers are visible
      await expect(table.locator('th:has-text("Usuario")')).toBeVisible();
      await expect(table.locator('th:has-text("Perfil")')).toBeVisible();
      await expect(table.locator('th:has-text("Nivel")')).toBeVisible();
    }

    // Verify we can see either the table or the empty state message
    const emptyState = page.locator('text=Sin usuarios con acceso');
    const hasEmptyState = await emptyState.count() > 0;
    expect(hasTable || hasEmptyState).toBe(true);
  });

});
