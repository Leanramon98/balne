import type { Page, Locator } from '@playwright/test';

export type TestRole = 'admin' | 'admin_destino' | 'evaluador' | 'carga';

const ROLE_CREDENTIALS: Record<TestRole, { email: string; password: string }> = {
  admin: { email: 'admin@test.com', password: 'Admin123!' },
  admin_destino: { email: 'admin_destino@test.com', password: 'Test123!' },
  evaluador: { email: 'evaluador@test.com', password: 'Test123!' },
  carga: { email: 'carga@test.com', password: 'Test123!' },
};

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('text=Credenciales inválidas');
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForSelector('#email', { state: 'visible' });
  }

  /**
   * Fill login form and submit.
   * After a successful login, waits for the redirect to / or /configuracion.
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    // Wait for navigation to complete after login
    // Admin users redirect to /configuracion, others to /
    await this.page.waitForURL(/\/$|\/configuracion/, {
      timeout: 15000,
    });
  }

  /**
   * Log in using a predefined test role.
   * Keeps the explicit `login(email, password)` API available for custom credentials.
   */
  async loginAs(role: TestRole) {
    const creds = ROLE_CREDENTIALS[role];
    if (!creds) {
      throw new Error(`Unknown test role: ${role}`);
    }
    await this.login(creds.email, creds.password);
  }
}
