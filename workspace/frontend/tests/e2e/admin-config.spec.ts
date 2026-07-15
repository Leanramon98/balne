import { test as base, expect } from '@playwright/test';
import { AdminConfigPage } from './pages/AdminConfigPage';
import { ensureAuthState } from './fixtures/auth';
import { seed } from './fixtures/seed';
import {
  deleteUserByEmail,
  deleteDestinationByName,
  deleteScopeByAcronym,
  deleteIndicatorByCode,
  getAdminRequirements,
} from './fixtures/cleanup';

const AUTH_FILE = 'tests/e2e/.auth/e2e-auth-admin.json';
const timestamp = Date.now();

const TEST_DATA = {
  userEmail: `e2e.user.${timestamp}@test.com`,
  userName: `E2E User ${timestamp}`,
  userNameEdited: `E2E User ${timestamp} Editado`,
  userRole: 'consultor',
  destinationName: `E2E Destino ${timestamp}`,
  destinationNameEdited: `E2E Destino ${timestamp} Editado`,
  scopeAcronym: `E2E-${String(timestamp).slice(-6)}`,
  scopeName: `E2E Ámbito ${timestamp}`,
  indicatorName: `E2E Indicador ${timestamp}`,
  indicatorCode: `IND-${timestamp.toString(36).toUpperCase()}`,
};

// All admin-config tests reuse the same authenticated browser context.
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

test.describe('Admin configuration', () => {
  test.describe.configure({ mode: 'serial' });

  let adminPage: AdminConfigPage;
  let adminToken: string;
  let requirementId: string;
  let testDestinationId: string;

  test.beforeAll(async ({ browser }) => {
    // Persist admin storage state and seed mutable test prerequisites.
    await ensureAuthState('admin', browser);
    const result = await seed();
    adminToken = result.adminToken;
    testDestinationId = result.testDestinationId;

    const requirements = await getAdminRequirements(adminToken);
    requirementId = requirements[0]?.id || requirements[0]?.ID;
    if (!requirementId) {
      throw new Error('No admin requirements available; indicator wizard cannot be exercised.');
    }
  });

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminConfigPage(page);
  });

  test.afterAll(async () => {
    // Clean up mutable entities created by this spec.
    const { adminToken: token } = await seed();
    await Promise.allSettled([
      deleteUserByEmail(TEST_DATA.userEmail, token),
      deleteDestinationByName(TEST_DATA.destinationNameEdited, token),
      deleteDestinationByName(TEST_DATA.destinationName, token),
      deleteScopeByAcronym(TEST_DATA.scopeAcronym, token),
      deleteIndicatorByCode(TEST_DATA.indicatorCode, token),
    ]);
  });

  // ── HU-24 User management ────────────────────────────────────────────────

  test.skip('HU-24 — Create user', async () => {
    await adminPage.goto();
    await adminPage.switchTab('Usuarios');

    await adminPage.openCreateUser();
    await adminPage.fillUserForm({
      name: TEST_DATA.userName,
      email: TEST_DATA.userEmail,
      role: 'consultor',
    });
    await adminPage.saveUser();

    // Wait for the dialog to close, then poll for the new user row.
    const row = adminPage.findUserRow(TEST_DATA.userEmail);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(TEST_DATA.userName);
  });

  test.skip('HU-24 — Edit user', async () => {
    await adminPage.goto();
    await adminPage.switchTab('Usuarios');

    await adminPage.openEditUser(TEST_DATA.userEmail);
    await adminPage.fillUserForm({
      name: TEST_DATA.userNameEdited,
      email: TEST_DATA.userEmail,
      role: TEST_DATA.userRole,
    });
    await adminPage.saveUser();

    const row = adminPage.findUserRow(TEST_DATA.userEmail);
    await expect(row).toBeVisible();
    await expect(row).toContainText(TEST_DATA.userNameEdited);
  });

  test.skip('HU-24 — Reset user password', async () => {
    await adminPage.goto();
    await adminPage.switchTab('Usuarios');

    const [dialog] = await Promise.all([
      adminPage.page.waitForEvent('dialog'),
      adminPage.clickResetPassword(TEST_DATA.userEmail),
    ]);

    expect(dialog.message()).toContain('Contraseña restaurada');
    await dialog.accept();
  });

  // ── HU-26 Destination management ─────────────────────────────────────────

  test.skip('HU-26 — Create destination', async () => {
    await adminPage.goto();
    await adminPage.switchTab('Destinos');

    await adminPage.openCreateDestination();
    await adminPage.fillDestinationForm({
      name: TEST_DATA.destinationName,
      country: 'Argentina',
      isAdhered: true,
    });
    await adminPage.saveDestination();

    const row = adminPage.findDestinationRow(TEST_DATA.destinationName);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Argentina');
  });

  test.skip('HU-26 — Edit destination', async () => {
    await adminPage.goto();
    await adminPage.switchTab('Destinos');

    await adminPage.openEditDestination(TEST_DATA.destinationName);
    await adminPage.fillDestinationForm({
      name: TEST_DATA.destinationNameEdited,
      country: 'Argentina',
      isAdhered: true,
    });
    await adminPage.saveDestination();

    const row = adminPage.findDestinationRow(TEST_DATA.destinationNameEdited);
    await expect(row).toBeVisible();
  });

  // ── HU-32 Scope management ───────────────────────────────────────────────

  test('HU-32 — Create scope', async () => {
    await adminPage.goto();
    await adminPage.switchTab('Ámbitos');

    await adminPage.openCreateScope();
    await adminPage.fillScopeForm({
      name: TEST_DATA.scopeName,
      acronym: TEST_DATA.scopeAcronym,
      description: 'Ámbito creado automáticamente por E2E',
      axis: 'gob',
    });
    await adminPage.saveScope();

    const row = adminPage.findScopeRow(TEST_DATA.scopeName);
    await expect(row).toBeVisible();
    await expect(row).toContainText(TEST_DATA.scopeAcronym);
  });

  // ── HU-34 Indicator wizard ───────────────────────────────────────────────

  test.skip('HU-34 — Create indicator using wizard', async () => {
    await adminPage.goto();
    await adminPage.switchTab('Indicadores');

    const reqs = await getAdminRequirements(adminToken);
    const req = reqs[0];
    const requirementLabel = `${req.code} — ${req.name}`;

    await adminPage.openCreateIndicator();
    await adminPage.fillIndicatorStep1({
      requirementId: requirementLabel,
      levelId: 'Alto',
      typology: 'obligatorio',
      classification: 'Cuantitativo',
      name: TEST_DATA.indicatorName,
      description: 'Indicador creado automáticamente por E2E',
      code: TEST_DATA.indicatorCode,
    });
    await adminPage.fillIndicatorStep2({ type: 'gradient' });
    await adminPage.fillIndicatorStep3({ mappingType: 'default' });
    await adminPage.saveIndicator();

    const row = adminPage.findIndicatorRow(TEST_DATA.indicatorName);
    await expect(row).toBeVisible();
    await expect(row).toContainText(TEST_DATA.indicatorCode);
  });
});
