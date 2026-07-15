import type { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the public Good Practices bank.
 *
 * No authentication required — accessible at /buenas-practicas
 *
 * Selectors from the actual UI:
 * - Search input: Input with placeholder "Buscar prácticas..."
 * - Scope select: Select with placeholder "Ámbito" (with "all" option)
 * - Axis select: Select with placeholder "Eje" (with "all" option)
 * - Country select: Select with placeholder "País"
 * - Practice cards: Card inside a Link with href /buenas-practicas/${id}
 * - Card title: h3 inside the card
 * - Back button: Button with "Volver al banco"
 */
export class GoodPracticesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to /buenas-practicas (no auth required)
   */
  async goto(): Promise<void> {
    await this.page.goto('/buenas-practicas');
    await this.page.waitForSelector('h1:has-text("Banco de Buenas Prácticas")', {
      state: 'visible',
      timeout: 15000,
    });
  }

  /**
   * Return all practice cards on the page
   */
  getPracticeCards(): Locator {
    return this.page.locator('a[href^="/buenas-practicas/"] > div[data-card="true"], a[href^="/buenas-practicas/"] > article');
  }

  /**
   * Return all practice names (h3 text inside cards)
   */
  async getPracticeNames(): Promise<string[]> {
    // Cards are inside <a> tags that wrap a Card div
    const cards = this.page.locator('a[href^="/buenas-practicas/"]').locator('h3');
    const count = await cards.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      names.push(await cards.nth(i).textContent() || '');
    }
    return names;
  }

  /**
   * Fill the search input and wait for client-side filter
   */
  async searchPractices(query: string): Promise<void> {
    const input = this.page.locator('input[placeholder="Buscar prácticas..."]');
    await input.clear();
    await input.fill(query);
    // Client-side filter has a small debounce
    await this.page.waitForTimeout(300);
  }

  /**
   * Select a scope filter by scope id.
   * Pass 'all' to reset the filter.
   */
  async filterByScope(scopeId: string): Promise<void> {
    const trigger = this.page.locator('label:has-text("Ámbito")').locator('..').locator('[role="combobox"]').first();
    await trigger.click();

    if (scopeId === 'all') {
      await this.page.locator('[role="option"]', { hasText: 'Todos los ámbitos' }).click();
    } else {
      // Look for the option by id — use the scope id from the option value
      await this.page.locator(`[role="option"][data-value="${scopeId}"]`).click().catch(async () => {
        // Fallback: click by text
        await this.page.locator('[role="option"]', { hasText: new RegExp(scopeId, 'i') }).click();
      });
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Select an axis filter.
   * Pass 'all' to reset the filter.
   */
  async filterByAxis(axis: string): Promise<void> {
    const trigger = this.page.locator('label:has-text("Eje")').locator('..').locator('[role="combobox"]').first();
    await trigger.click();

    if (axis === 'all') {
      await this.page.locator('[role="option"]', { hasText: 'Todos los ejes' }).click();
    } else {
      await this.page.locator('[role="option"]', { hasText: new RegExp(axis, 'i') }).click();
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Select a country filter.
   * Pass 'all' to reset the filter.
   */
  async filterByCountry(country: string): Promise<void> {
    const trigger = this.page.locator('label:has-text("País")').locator('..').locator('[role="combobox"]').first();
    await trigger.click();

    if (country === 'all') {
      await this.page.locator('[role="option"]', { hasText: 'Todos los países' }).click();
    } else {
      await this.page.locator('[role="option"]', { hasText: new RegExp(country, 'i') }).click();
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Click a practice card by matching its name (h3 text)
   */
  async clickPracticeCard(name: string): Promise<void> {
    const card = this.page.locator('a[href^="/buenas-practicas/"]', { has: this.page.locator(`h3:has-text("${name}")`) });
    await card.click();
    await this.page.waitForURL(/\/buenas-practicas\/[a-f0-9-]+/, { timeout: 15000 });
  }

  // ── Detail page ─────────────────────────────────────────────────────────────

  /**
   * Get the main title (h1) on the detail page
   */
  async getDetailTitle(): Promise<string> {
    const h1 = this.page.locator('h1').first();
    return h1.textContent() || '';
  }

  /**
   * Get the destination name with country (MapPin row) on the detail page
   */
  async getDetailDestination(): Promise<string> {
    const el = this.page.locator('text=/.*MapPin.*|,/').first();
    return el.textContent() || '';
  }

  /**
   * Get the "Volver al banco" back button locator
   */
  async getBackButton(): Promise<Locator> {
    return this.page.locator('button:has-text("Volver al banco")');
  }
}
