import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('debug login', async ({ page }) => {
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
  page.on('request', (req) => console.log('REQUEST:', req.method(), req.url()));
  page.on('response', (res) => console.log('RESPONSE:', res.status(), res.url()));
  page.on('requestfailed', (req) => console.log('REQ FAILED:', req.method(), req.url(), req.failure()?.errorText));
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  const error = page.locator('text=Credenciales inválidas');
  await loginPage.login('admin@test.com', 'Admin123!');
  console.log('URL after login attempt:', page.url());
  await expect(page).toHaveURL(/\/$|\/configuracion/, { timeout: 30000 });
});
