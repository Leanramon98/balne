import type { Page, Locator } from '@playwright/test';

/**
 * Mapping from status keys to display labels used in buttons and badges.
 */
const STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  en_curso: 'En curso',
  carga_finalizada: 'Carga finalizada',
  en_evaluacion: 'En evaluación',
  cerrada: 'Cerrada',
  anulada: 'Anulada',
};

/**
 * Transition buttons labels (from TRANSITION_CONFIG in EvalStatusActions).
 */
const TRANSITION_BUTTONS: Record<string, string> = {
  en_curso: 'Iniciar',
  carga_finalizada: 'Finalizar carga',
  en_evaluacion: 'Iniciar evaluación',
  cerrada: 'Cerrar',
  anulada: 'Anular',
  borrador: 'Reactivar',
};

export class EvaluationDetailPage {
  readonly page: Page;
  readonly title: Locator;
  readonly statusBadge: Locator;
  readonly typeBadge: Locator;
  readonly confirmDialog: Locator;
  readonly confirmButton: Locator;
  readonly promoteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // The Badge component renders as a plain <div> (no "badge" CSS class).
    // It's a sibling that immediately follows the <h1> in the header.
    this.title = page.locator('h1');
    this.statusBadge = page.locator('h1 + div');
    this.typeBadge = page.locator('h1 + div + div');
    this.confirmDialog = page.locator('[role="dialog"]');
    this.confirmButton = this.confirmDialog.locator('button:has-text("Confirmar")');
    // Match the <a> link to the promote page (NOT the <button> inside it, which also matches)
    this.promoteButton = page.locator('a[href*="promocionar"]', {
      hasText: 'Promover',
    });
  }

  /**
   * Change evaluation status by clicking the transition button and confirming.
   * targetStatus is the status key (e.g. 'en_curso', 'cerrada', 'anulada').
   */
  async changeStatus(targetStatus: string) {
    const buttonLabel = TRANSITION_BUTTONS[targetStatus] ?? targetStatus;

    // Find the transition button by its text
    const transitionButton = this.page.locator('button', {
      hasText: buttonLabel,
    });
    await transitionButton.waitFor({ state: 'visible' });
    await transitionButton.click();

    // Wait for the ConfirmDialog to appear
    await this.confirmDialog.waitFor({ state: 'visible' });

    // Click the Confirm button
    await this.confirmButton.click();

    // Wait for the dialog to close and the status to update
    await this.confirmDialog.waitFor({ state: 'detached', timeout: 10000 });
    await this.page.waitForTimeout(500);
  }

  /**
   * Read the current status badge text.
   * Returns the display label (e.g. "Borrador", "En curso", "Cerrada").
   */
  async getStatus(): Promise<string> {
    await this.statusBadge.waitFor({ state: 'visible' });
    const text = await this.statusBadge.textContent();
    return text?.trim() ?? '';
  }

  /**
   * Read the allowed transition buttons that are currently visible.
   * Returns an array of status keys.
   */
  async getAllowedTransitions(): Promise<string[]> {
    // The transition buttons are inside a flex container
    const transitionContainer = this.page.locator('div.flex.flex-wrap.gap-2');
    if ((await transitionContainer.count()) === 0) return [];

    const buttons = transitionContainer.locator('button');
    const count = await buttons.count();
    const transitions: string[] = [];

    // Build reverse mapping: label -> status key
    const labelToStatus: Record<string, string> = {};
    for (const [status, label] of Object.entries(TRANSITION_BUTTONS)) {
      labelToStatus[label] = status;
    }

    for (let i = 0; i < count; i++) {
      const text = (await buttons.nth(i).textContent())?.trim() ?? '';
      const matchedStatus = labelToStatus[text];
      if (matchedStatus) {
        transitions.push(matchedStatus);
      } else {
        // Fallback: use the text as-is for unknown transitions
        transitions.push(text);
      }
    }

    return transitions;
  }

  /**
   * Click the "Promover" button to navigate to the promotion page.
   */
  async promote() {
    await this.promoteButton.waitFor({ state: 'visible' });
    await this.promoteButton.click();
    await this.page.waitForURL(/\/promocionar/, { timeout: 15000 });
  }

  /**
   * Get scope progress cards from the "Ámbitos" tab.
   * Returns an array of { name, completed, total, percentage }.
   */
  async getScopeCards(): Promise<
    { scopeId: string; name: string; acronym: string; completed: number; total: number; percentage: number }[]
  > {
    // Click on the "Ámbitos" tab first
    const ambitosTab = this.page.locator('button[role="tab"]:has-text("Ámbitos")');
    if (await ambitosTab.count() > 0) {
      await ambitosTab.click();
      await this.page.waitForTimeout(500);
    }

    // Read the summary text: "X/Y completados (Z%)"
    const summaryText = this.page.locator('text=completados');
    // The scope cards are in a grid
    const cards = this.page.locator('[class*="grid"] > [class*="card"]');

    // Fall back to individual scope card entries if the grid pattern is different
    const scopeCards = this.page.locator('div.grid.gap-4 > div, div.grid > div');
    const cardCount = await scopeCards.count();
    const results: {
      scopeId: string;
      name: string;
      acronym: string;
      completed: number;
      total: number;
      percentage: number;
    }[] = [];

    if (cardCount === 0) return results;

    for (let i = 0; i < cardCount; i++) {
      const card = scopeCards.nth(i);
      const cardText = (await card.textContent()) ?? '';

      // Extract progress info from card content: "X/Y (Z%)"
      const progressMatch = cardText.match(/(\d+)\s*\/\s*(\d+)\s*\((\d+)\s*%\)/);
      if (progressMatch) {
        // Try to find scope name (first bold/strong element or first substantial text)
        const nameMatch = cardText.match(/^([A-ZÁÉÍÓÚÑa-zéíóúñ]+)/);
        const acronym = nameMatch ? nameMatch[1] : '';

        results.push({
          scopeId: `scope-${i}`,
          name: acronym || `Scope ${i + 1}`,
          acronym,
          completed: parseInt(progressMatch[1], 10),
          total: parseInt(progressMatch[2], 10),
          percentage: parseInt(progressMatch[3], 10),
        });
      }
    }

    return results;
  }
}
