import type { Page, Locator } from '@playwright/test';

export type GradientValue = '0%' | '25%' | '50%' | '75%' | '100%';
export type BooleanValue = 'Sí' | 'No';

/**
 * Page Object Model for indicator interactions inside an evaluation scope.
 *
 * Selectors are derived from the actual UI components:
 *  - IndicatorTable renders `#indicators-table`
 *  - IndicatorRow renders edit (pencil), view (eye), and delete (trash) actions
 *  - DestinationValueCard renders the gradient/boolean/numeric inputs and save button
 *  - IndicatorMessages renders the message thread and input
 */
export class IndicatorPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly indicatorTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[placeholder="Buscar indicador..."]');
    this.indicatorTable = page.locator('#indicators-table');
  }

  /**
   * Navigate to the scope indicators page.
   */
  async goto(evaluationId: string, scopeId: string) {
    await this.page.goto(`/evaluaciones/${evaluationId}/ambitos/${scopeId}`);
    await this.indicatorTable.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Return all data rows in the indicators table.
   */
  getIndicatorRows(): Locator {
    return this.indicatorTable.locator('tbody tr');
  }

  /**
   * Fill the indicator search box and wait for the client-side filter.
   */
  async searchIndicators(text: string) {
    await this.searchInput.fill(text);
    // The filter is synchronous React state; a tiny debounce ensures re-render.
    await this.page.waitForTimeout(300);
  }

  /**
   * Click the edit (pencil) action for an indicator and wait for the edit page.
   */
  async openIndicatorEdit(indicatorId: string) {
    const editLink = this.page.locator(
      `a[href*="/${indicatorId}/editar"][title="Editar indicador"]`
    );
    await Promise.all([
      this.page.waitForURL(new RegExp(`/${indicatorId}/editar$`), {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      }),
      editLink.click(),
    ]);
  }

  /**
   * Click the view (eye) action for an indicator and wait for the detail page.
   */
  async openIndicatorDetail(indicatorId: string) {
    const viewLink = this.page.locator(
      `a[href$="/${indicatorId}"][title="Ver indicador"]`
    );
    await Promise.all([
      this.page.waitForURL(new RegExp(`/evaluaciones/.+/ambitos/.+/${indicatorId}$`), {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      }),
      viewLink.click(),
    ]);
  }

  /**
   * Select a gradient value in the destination value card.
   */
  async setGradientValue(value: GradientValue) {
    const field = this.page.locator('div').filter({
      has: this.page.locator('label:has-text("Valor actual")'),
    });
    const trigger = field.locator('[role="combobox"]').first();
    await trigger.click();
    await this.page.locator('[role="option"]', { hasText: value }).click();
  }

  /**
   * Select a boolean value in the destination value card.
   */
  async setBooleanValue(value: BooleanValue) {
    const field = this.page.locator('div').filter({
      has: this.page.locator('label:has-text("Valor actual")'),
    });
    const trigger = field.locator('[role="combobox"]').first();
    await trigger.click();
    await this.page.locator('[role="option"]', { hasText: value }).click();
  }

  /**
   * Fill a numeric value in the destination value card.
   */
  async setNumericValue(value: string) {
    const field = this.page.locator('div').filter({
      has: this.page.locator('label:has-text("Valor actual")'),
    });
    const input = field.locator('input[type="number"]').first();
    await input.fill(value);
  }

  /**
   * Fill the destination observations textarea.
   */
  async setObservation(text: string) {
    const field = this.page.locator('div').filter({
      has: this.page.locator('label:has-text("Observaciones del destino")'),
    });
    const textarea = field.locator('textarea').first();
    await textarea.fill(text);
  }

  /**
   * Click the destination value save button and wait for the save to finish.
   */
  async saveValue() {
    const saveButton = this.page.locator('button:has-text("Guardar Valor Destino")');
    await saveButton.click();
    // Wait for the saving state to resolve back to the idle label.
    await this.page.locator('button:has-text("Guardando...")').waitFor({
      state: 'detached',
      timeout: 15000,
    });
  }

  /**
   * Click the first visible delete (trash) action in the table and confirm.
   */
  async deleteValue() {
    const deleteButton = this.page.locator('button[title="Eliminar indicador"]').first();
    await deleteButton.click();

    const dialog = this.page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    const confirmButton = dialog.locator('button:has-text("Eliminar")');
    await confirmButton.click();
    await dialog.waitFor({ state: 'detached', timeout: 10000 });
  }

  /**
   * Send a message in the indicator message thread.
   */
  async sendMessage(text: string) {
    const input = this.page.locator('textarea[placeholder="Escriba un mensaje..."]');
    await input.fill(text);

    const sendButton = this.page.locator('button:has-text("Enviar mensaje")');
    await sendButton.click();

    // Wait until the message appears in the thread.
    await this.page.locator('text=' + text).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Return all message texts currently visible in the thread.
   */
  async getMessages(): Promise<string[]> {
    const container = this.page.locator('div.flex.flex-col.gap-4').filter({
      has: this.page.locator('textarea[placeholder="Escriba un mensaje..."]'),
    });
    const bubbles = container.locator('div.rounded-2xl.text-sm.shadow-sm');
    return bubbles.allTextContents();
  }
}
