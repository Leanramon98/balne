import type { Page } from '@playwright/test';

export class ResultsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/resultados');
    await this.page.waitForSelector('h1:has-text("Resultados")', { state: 'visible' });
  }

  /**
   * Select a year from the first filter dropdown.
   */
  async selectYear(year: string) {
    const triggers = this.page.locator('[role="combobox"]');
    // Order in ResultsFilters: year, axis, typology, member type, destination
    await triggers.nth(0).click();
    await this.page.getByRole('option', { name: year, exact: true }).click();
  }

  /**
   * Select a scope from the multi-select popover.
   * The scope label text includes acronym and name, e.g. "ORG — Organización".
   */
  async selectScope(scopeLabel: string) {
    const scopeTrigger = this.page.locator('button:has-text("Todos los ámbitos")');
    await scopeTrigger.click();
    const option = this.page.locator('label', { hasText: scopeLabel });
    await option.locator('button[role="checkbox"]').click();
    // Close the popover by clicking elsewhere (the filters card header)
    await this.page.locator('h1:has-text("Resultados")').click();
  }

  /**
   * Select a member type from its dropdown.
   */
  async selectMemberType(memberTypeName: string) {
    const triggers = this.page.locator('[role="combobox"]');
    // member type is the 4th combobox (0:year, 1:axis, 2:typology, 3:member type)
    await triggers.nth(3).click();
    await this.page.getByRole('option', { name: memberTypeName, exact: true }).click();
  }

  async selectDestination(destinationName: string) {
    const triggers = this.page.locator('[role="combobox"]');
    // destination is the 5th combobox
    await triggers.nth(4).click();
    await this.page.getByRole('option', { name: destinationName, exact: true }).click();
  }

  async clickBuscar() {
    await this.page.getByRole('button', { name: /Buscar/i }).click();
  }

  getSummaryCards() {
    return this.page.locator('.grid.gap-4 > div');
  }

  getDetailTable() {
    return this.page.locator('table');
  }

  getCharts() {
    // Charts are rendered inside the same content area after the detail table.
    return this.page.locator('text=Visualizaciones');
  }

  async hasResults() {
    const table = this.getDetailTable();
    if ((await table.count()) === 0) return false;
    const rows = table.locator('tbody tr');
    return (await rows.count()) > 0;
  }

  async getDestinationNames() {
    const table = this.getDetailTable();
    if ((await table.count()) === 0) return [];
    const cells = table.locator('tbody tr td:first-child');
    const names: string[] = [];
    for (let i = 0; i < await cells.count(); i++) {
      const text = await cells.nth(i).textContent();
      if (text) names.push(text.trim());
    }
    return names;
  }
}
