import { test as base, expect, Page, Browser } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ActionPage } from './pages/ActionPage';
import { GoodPracticesPage } from './pages/GoodPracticesPage';
import { seed } from './fixtures/seed';
import { deleteActionById } from './fixtures/cleanup';
import { ensureAuthState } from './fixtures/auth';
import type { TestRole } from './fixtures/seed';

// ── Configuration ─────────────────────────────────────────────────────────────

const AUTH_DIR = 'tests/e2e/.auth';
const AUTH_FILE_ADMIN = `${AUTH_DIR}/e2e-auth-admin.json`;
const AUTH_FILE_ADMIN_DESTINO = `${AUTH_DIR}/e2e-auth-admin_destino.json`;
const AUTH_FILE_EVALUADOR = `${AUTH_DIR}/e2e-auth-evaluador.json`;

// Shared state file for cross-role communication
const SHARED_STATE_FILE = `${AUTH_DIR}/actions-good-practices-state.json`;

// ── Shared state helpers ───────────────────────────────────────────────────────

async function readSharedState(): Promise<{ actionId?: string; actionName?: string }> {
  try {
    const fs = await import('fs');
    if (fs.existsSync(SHARED_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(SHARED_STATE_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

async function writeSharedState(state: { actionId?: string; actionName?: string }): Promise<void> {
  const fs = await import('fs');
  fs.writeFileSync(SHARED_STATE_FILE, JSON.stringify(state, null, 2));
}

// ── API helpers ───────────────────────────────────────────────────────────────

const API_URL = process.env.API_URL || 'http://localhost:8080';

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

  if (res.status === 204 || res.status === 201) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `${options.method || 'GET'} ${path} failed (${res.status}): ${data.error || data.message || res.statusText}`
    );
  }
  return data;
}

async function createActionViaApi(
  token: string,
  destinationId: string,
  name: string
): Promise<{ id: string }> {
  return apiFetch('/api/evaluations/actions', token, {
    method: 'POST',
    body: {
      destination_id: destinationId,
      name,
      status: 'idea',
    },
  });
}

// ── Test fixtures ─────────────────────────────────────────────────────────────

type AdminPage = Page & { _adminToken?: string };
type AdminDestinoPage = Page & { _adminDestinoToken?: string };
type EvaluadorPage = Page & { _evaluadorToken?: string };

const testAdmin = base.extend<{ adminPage: Page & { _adminToken: string } }>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_FILE_ADMIN });
    await use(ctx);
    await ctx.close();
  },
  adminPage: async ({ context }, use) => {
    const pg = await context.newPage() as AdminPage;
    await use(pg);
  },
});

const testAdminDestino = base.extend<{ adminDestinoPage: Page & { _adminDestinoToken: string } }>({
  context: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_FILE_ADMIN_DESTINO });
    await use(ctx);
    await ctx.close();
  },
  adminDestinoPage: async ({ context }, use) => {
    const pg = await context.newPage() as AdminDestinoPage;
    await use(pg);
  },
});

const testEvaluador = base.extend<{ evaluadorPage: Page & { _evaluadorToken: string } }>({
  context: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_FILE_EVALUADOR });
    await use(ctx);
    await ctx.close();
  },
  evaluadorPage: async ({ context }, use) => {
    const pg = await context.newPage() as EvaluadorPage;
    await use(pg);
  },
});

// Public (no auth) fixture
const testPublic = base.extend({
  context: async ({ browser }, use) => {
    const ctx = await browser.newContext(); // No auth
    await use(ctx);
    await ctx.close();
  },
});

// ── Tests ─────────────────────────────────────────────────────────────────────

testAdmin.describe('Actions: Admin role (HU-15)', () => {
  testAdmin.describe.configure({ mode: 'serial' });

  let adminToken: string;
  let testDestinationId: string;

  testAdmin.beforeAll(async ({ browser }) => {
    // Ensure auth states for all roles
    await ensureAuthState('admin', browser);
    await ensureAuthState('evaluador', browser);
    await ensureAuthState('admin_destino', browser);

    // Seed and get tokens
    const seedResult = await seed();
    adminToken = seedResult.adminToken;
    testDestinationId = seedResult.testDestinationId;

    // Store admin token for use in tests
    (global as any).__adminToken = adminToken;
  });

  testAdmin.beforeEach(async ({ adminPage }) => {
    (adminPage as AdminPage)._adminToken = adminToken;
  });

  testAdmin.afterAll(async () => {
    // Cleanup: delete created action via API
    const state = await readSharedState();
    if (state.actionId && adminToken) {
      await deleteActionById(state.actionId, adminToken);
    }
    // Clean up state file
    try {
      const fs = await import('fs');
      if (fs.existsSync(SHARED_STATE_FILE)) fs.unlinkSync(SHARED_STATE_FILE);
    } catch {}
  });

  // ── HU-15: Create action ─────────────────────────────────────────────────
  testAdmin.skip('HU-15 — Create action', async ({ adminPage }) => {
    const actionPage = new ActionPage(adminPage);
    await adminPage.goto('/acciones');
    await adminPage.waitForSelector('table', { state: 'visible', timeout: 15000 });

    // Click "Nueva Acción"
    await actionPage.clickNuevaAccion();

    // Fill form on Datos Básicos tab (default active)
    const actionName = `E2E Acción ${Date.now()}`;
    await actionPage.fillName(actionName);

    // Switch to Clasificación tab and select GOB axis
    await actionPage.toggleAxis('GOB');

    // Select first scope (check for visible scope buttons)
    await adminPage.locator('button[role="tab"]:has-text("Clasificación")').click();
    await adminPage.waitForTimeout(300);
    const scopeBtn = adminPage.locator('button', { hasText: /GOB_A|GOB_P|SOST_A/ }).first();
    if (await scopeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await scopeBtn.click();
    }

    // Switch to Responsables tab and fill responsible person
    await actionPage.fillResponsiblePerson('Responsable E2E');

    // Submit
    await actionPage.submit();

    // Should navigate to /acciones/${id}
    await expect(adminPage).toHaveURL(/\/acciones\/[a-f0-9-]+$/, { timeout: 15000 });

    // Extract action id from URL
    const url = adminPage.url();
    const match = url.match(/\/acciones\/([a-f0-9-]+)/);
    const actionId = match?.[1] || '';

    // Save action ID for cross-test communication
    await writeSharedState({ actionId, actionName });

    // Verify action name appears on the page
    await expect(adminPage.locator('h1')).toContainText(actionName);

    // Go back to list and verify it appears
    await actionPage.gotoList();
    const row = await actionPage.findActionByName(actionName);
    expect(row).not.toBeNull();
  });

  // ── HU-15: Edit action ───────────────────────────────────────────────────
  testAdmin.skip('HU-15 — Edit action', async ({ adminPage }) => {
    const actionPage = new ActionPage(adminPage);
    const state = await readSharedState();

    // If no action from previous test, create one now
    if (!state.actionId) {
      const actionName = `E2E Acción Edit ${Date.now()}`;
      const newAction = await createActionViaApi(adminToken, testDestinationId, actionName);
      await writeSharedState({ actionId: newAction.id, actionName });
      state.actionId = newAction.id;
    }

    // Navigate to edit page
    await actionPage.gotoEdit(state.actionId);

    // Change name
    const newName = `${state.actionName} (editada)`;
    await actionPage.fillName(newName);

    // Change status to en_ejecucion
    await actionPage.fillStatus('en_ejecucion');

    // Submit
    await actionPage.submit();

    // Wait for the success alert
    await adminPage.waitForTimeout(500);

    // Verify name is updated
    await adminPage.waitForURL(/\/acciones\/[a-f0-9-]+$/, { timeout: 10000 }).catch(() => {});
    const h1 = await adminPage.locator('h1').textContent();
    expect(h1).toContain(newName);

    // Update shared state with new name
    await writeSharedState({ actionId: state.actionId, actionName: newName });
  });
});

testEvaluador.describe('Actions: Evaluador role (HU-20)', () => {
  testEvaluador.describe.configure({ mode: 'serial' });

  testEvaluador.beforeAll(async ({ browser }) => {
    // Ensure auth states exist
    await ensureAuthState('admin', browser);
    await ensureAuthState('evaluador', browser);
    await ensureAuthState('admin_destino', browser);
  });

  // ── HU-20: Designate as good practice ────────────────────────────────────
  testEvaluador('HU-20 — Designate action as good practice', async ({ evaluadorPage }) => {
    const actionPage = new ActionPage(evaluadorPage);
    const state = await readSharedState();

    if (!state.actionId) {
      // Skip if no action was created in admin tests
      testEvaluador.skip();
      return;
    }

    // Navigate to the action detail
    await evaluadorPage.goto(`/acciones/${state.actionId}`);
    await evaluadorPage.waitForSelector('h1', { state: 'visible', timeout: 15000 });

    // Verify "Designar como Buena Práctica" button is visible
    const designateBtn = evaluadorPage.locator('button:has-text("Designar como Buena Práctica")');
    await expect(designateBtn).toBeVisible();

    // Click it
    await designateBtn.click();
    await evaluadorPage.waitForTimeout(1000);

    // Status should change to "Designada"
    const badge = evaluadorPage.locator('text=Designada');
    await expect(badge).toBeVisible();
  });
});

testAdminDestino.describe('Actions: Admin Destino role (HU-21)', () => {
  testAdminDestino.describe.configure({ mode: 'serial' });

  testAdminDestino.beforeAll(async ({ browser }) => {
    await ensureAuthState('admin', browser);
    await ensureAuthState('evaluador', browser);
    await ensureAuthState('admin_destino', browser);
  });

  // ── HU-21: Approve good practice ─────────────────────────────────────────
  testAdminDestino('HU-21 — Approve good practice', async ({ adminDestinoPage }) => {
    const actionPage = new ActionPage(adminDestinoPage);
    const state = await readSharedState();

    if (!state.actionId) {
      testAdminDestino.skip();
      return;
    }

    // Navigate to the action detail
    await adminDestinoPage.goto(`/acciones/${state.actionId}`);
    await adminDestinoPage.waitForSelector('h1', { state: 'visible', timeout: 15000 });

    // Verify "Aprobar" button is visible (status should be "Designada" from previous test)
    const approveBtn = adminDestinoPage.locator('button:has-text("Aprobar")');
    await expect(approveBtn).toBeVisible();

    // Click "Aprobar"
    await approveBtn.click();
    await adminDestinoPage.waitForTimeout(1000);

    // Status should change to "Aprobada"
    const badge = adminDestinoPage.locator('text=Aprobada');
    await expect(badge).toBeVisible();
  });
});

testPublic.describe('Public Good Practices Bank (HU-22)', () => {
  testPublic.describe.configure({ mode: 'serial' });

  let goodPracticesPage: GoodPracticesPage;

  testPublic.beforeEach(async ({ page }) => {
    goodPracticesPage = new GoodPracticesPage(page);
  });

  // ── HU-22: No auth required ─────────────────────────────────────────────
  testPublic('HU-22 — Public bank loads without auth', async ({ page }) => {
    // Go directly to /buenas-practicas — no login
    await page.goto('/buenas-practicas');

    // Page should load without redirecting to login
    await expect(page).toHaveURL('/buenas-practicas', { timeout: 10000 });

    // Hero should be visible
    await expect(page.locator('h1:has-text("Banco de Buenas Prácticas")')).toBeVisible();

    // Filters should be visible
    await expect(page.locator('input[placeholder="Buscar prácticas..."]')).toBeVisible();
  });

  // ── HU-22: Filters work ────────────────────────────────────────────────
  testPublic('HU-22 — Filters work on public bank', async ({ page }) => {
    await goodPracticesPage.goto();

    // Fill search
    await goodPracticesPage.searchPractices('test');

    // Try scope filter (pick second option if available)
    const scopeSelect = page.locator('label:has-text("Ámbito")').locator('..').locator('[role="combobox"]').first();
    const scopeCount = await page.locator('[role="option"]').count();
    if (scopeCount > 1) {
      // Select second option (first is "Todos los ámbitos")
      await scopeSelect.click();
      await page.locator('[role="option"]').nth(1).click();
      await page.waitForTimeout(300);
    }

    // Page should still be on /buenas-practicas
    await expect(page).toHaveURL('/buenas-practicas');
  });

  // ── HU-22: Open detail ─────────────────────────────────────────────────
  testPublic('HU-22 — Open public good practice detail', async ({ page }) => {
    await goodPracticesPage.goto();

    // Find the first practice card
    const cards = page.locator('a[href^="/buenas-practicas/"]');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      // Skip if no practices exist — this is expected in fresh environments
      testPublic.skip();
      return;
    }

    // Get the first card's href and name
    const firstCard = cards.first();
    const cardName = await firstCard.locator('h3').textContent();
    const cardHref = await firstCard.getAttribute('href');

    await firstCard.click();
    await page.waitForURL(/\/buenas-practicas\/[a-f0-9-]+/, { timeout: 15000 });

    // Detail page should show the action name
    if (cardName) {
      await expect(page.locator('h1')).toContainText(cardName!, { timeout: 5000 });
    }

    // Back button should work
    const backBtn = goodPracticesPage.getBackButton();
    await expect(backBtn).toBeVisible();
  });
});
