import type { Browser } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { seed } from './seed';
import type { TestRole } from './seed';

export type { TestRole };

const AUTH_DIR = 'tests/e2e/.auth';

/**
 * Ensure a authenticated browser context is persisted to disk for the given role.
 *
 * - Uses the seeded credentials for the role.
 * - Logs in through the UI and saves Playwright storageState.
 * - The resulting file can be loaded by tests via `browser.newContext({ storageState })`.
 *
 * @param role - one of the E2E test roles
 * @param browser - Playwright Browser instance
 * @returns path to the saved storageState JSON file
 */
export async function ensureAuthState(role: TestRole, browser: Browser): Promise<string> {
  const authPath = `${AUTH_DIR}/e2e-auth-${role}.json`;

  // Seed ensures the user exists and gives us the live credentials.
  const { usersByRole } = await seed();
  const user = usersByRole[role];
  if (!user) {
    throw new Error(`No seeded user found for role "${role}"`);
  }

  // Ensure the auth directory exists.
  const fs = await import('fs');
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  const loginPage = new LoginPage(page);

  try {
    await loginPage.goto();
    await loginPage.loginAs(role);

    await context.storageState({ path: authPath });
    console.log(`✓ Auth state saved for ${role}: ${authPath}`);

    return authPath;
  } finally {
    await context.close();
  }
}
