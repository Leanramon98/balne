import type { Page, Locator } from '@playwright/test';

export class EvaluationListPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly evaluationTable: Locator;
  readonly paginationInfo: Locator;

  // Create form fields
  readonly nameInput: Locator;
  readonly destinationSelect: Locator;
  readonly typeSelect: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('a[href="/evaluaciones/nuevo"] button, a[href="/evaluaciones/nuevo"]', {
      hasText: 'Nueva Evaluación',
    });
    this.evaluationTable = page.locator('table');
    this.paginationInfo = page.locator('text=resultados');

    // Create form fields (on /evaluaciones/nuevo)
    // Radix/Shadcn Select components render role="combobox" without an id.
    // We locate them by their visible placeholder/label text.
    this.nameInput = page.locator('#name');
    this.destinationSelect = page.locator('[role="combobox"]', { hasText: 'Seleccionar destino' });
    this.typeSelect = page.locator('[role="combobox"]', { hasText: /Autodiagnóstico|Diagnóstico|Auditoría|Medición Espontánea/ });
    this.startDateInput = page.locator('#startDate');
    this.endDateInput = page.locator('#endDate');
    this.saveButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/evaluaciones');
    await this.page.waitForSelector('h1', { state: 'visible' });
  }

  /**
   * Navigate to create form, fill in all fields, and submit.
   * Waits for redirect to the new evaluation detail page after creation.
   */
  async createEvaluation(
    name: string,
    type: string,
    startDate?: string,
    endDate?: string,
  ) {
    // Navigate to create form
    await this.page.goto('/evaluaciones/nuevo');
    await this.page.waitForSelector('#name', { state: 'visible' });

    // Fill name
    await this.nameInput.fill(name);

    // Select destination (first available)
    await this.destinationSelect.click();
    const destOption = this.page.locator('[role="option"]').first();
    await destOption.waitFor({ state: 'visible' });
    await destOption.click();

    // Select type
    await this.typeSelect.click();
    const typeOption = this.page.locator('[role="option"]', {
      hasText: type,
    });
    await typeOption.waitFor({ state: 'visible' });
    await typeOption.click();

    // Fill dates if provided
    if (startDate) {
      await this.startDateInput.fill(startDate);
    }
    if (endDate) {
      await this.endDateInput.fill(endDate);
    }

    // Submit form
    await this.saveButton.click();

    // After creation, we are redirected to the evaluation detail page
    await this.page.waitForURL(/\/evaluaciones\/(?!nuevo)[a-f0-9-]+/, {
      timeout: 15000,
    });
  }

  /**
   * Search for an evaluation by name in the table.
   * Waits for data to load (handles async SWR fetch), then returns
   * the row Locator if found, null otherwise.
   */
  async findEvaluation(name: string): Promise<Locator | null> {
    // First, wait for data to finish loading — the API fetch replaces
    // the loading skeleton rows with actual data containing the name.
    try {
      await this.page.waitForSelector(`table:has-text("${name}")`, { timeout: 15000 });
    } catch {
      return null;
    }
    const row = this.evaluationTable.locator('tr', { hasText: name });
    const count = await row.count();
    return count > 0 ? row : null;
  }

  /**
   * Click on an evaluation name in the table to open its detail page.
   * The name is rendered as plain text in a <td>, so we open the actions
   * dropdown (⋯) for that row and click "Ver".
   */
  async clickEvaluation(name: string) {
    // Find the row containing the evaluation name
    const row = this.page.locator('tr', { hasText: name });
    // Click the dropdown trigger (⋯ button) inside that row's actions cell
    const dropdownTrigger = row.locator('td:last-child button');
    await dropdownTrigger.click();
    // Click "Ver" in the dropdown menu
    const verLink = this.page.locator('a[href*="/evaluaciones/"]:has-text("Ver")');
    await verLink.waitFor({ state: 'visible', timeout: 5000 });
    await verLink.click();
    await this.page.waitForURL(/\/evaluaciones\/(?!nuevo)[a-f0-9-]+/, {
      timeout: 15000,
    });
  }

  /**
   * Read the current pagination state from the info text.
   * Returns { page, totalPages, total } or null if not visible.
   */
  async getCurrentPage(): Promise<{
    page: number;
    totalPages: number;
    total: number;
  } | null> {
    const info = this.page.locator('text=resultados');
    if ((await info.count()) === 0) return null;

    const text = await info.textContent();
    if (!text) return null;

    // Text format: "X resultados · Página Y de Z"
    const match = text.match(
      /(\d+)\s*resultados\s*·\s*Página\s*(\d+)\s*de\s*(\d+)/,
    );
    if (!match) return null;

    return {
      total: parseInt(match[1], 10),
      page: parseInt(match[2], 10),
      totalPages: parseInt(match[3], 10),
    };
  }

  /**
   * Click on a specific page number in pagination controls.
   */
  async goToPage(n: number) {
    const pageLink = this.page.locator(
      `[role="navigation"] a:has-text("${n}")`,
    );
    await pageLink.click();
    // Wait for the data to refresh
    await this.page.waitForTimeout(1000);
  }
}
