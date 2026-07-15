import type { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Action CRUD and Good Practice designation flows.
 *
 * Selectors are derived from the actual UI components:
 * - Actions list renders a Table with rows inside TableBody
 * - "Nueva Acción" is a Button with that text and href /acciones/nuevo
 * - Action name is in a TableCell with font-medium class
 * - Actions dropdown uses DropdownMenu with MoreHorizontal icon
 * - "Ver" link has Eye icon, href /acciones/${id}
 * - "Editar" link has Edit icon, href /acciones/${id}/editar
 * - Action form tabs: Datos Básicos, Clasificación, Temporal, Responsables, ODS, Presupuesto, Adicional, Evidencias, Indicadores vinculados
 * - Good Practice card has CardTitle "Buena Práctica DTI"
 * - "Designar como Buena Práctica", "Aprobar", "Rechazar" are Buttons with those exact texts
 */
export class ActionPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── List page ────────────────────────────────────────────────────────────────

  /**
   * Navigate to /acciones
   */
  async gotoList(): Promise<void> {
    await this.page.goto('/acciones');
    await this.page.waitForSelector('table', { state: 'visible', timeout: 15000 });
  }

  /**
   * Click the "Nueva Acción" button that links to /acciones/nuevo
   */
  async clickNuevaAccion(): Promise<void> {
    const btn = this.page.locator('a[href="/acciones/nuevo"]', { hasText: 'Nueva Acción' });
    await btn.click();
    await this.page.waitForURL('/acciones/nuevo', { timeout: 15000 });
  }

  /**
   * Return all table rows in the actions table body
   */
  getActionRows(): Locator {
    return this.page.locator('table tbody tr');
  }

  /**
   * Return the names from the Nombre column of all rows
   */
  async getActionNames(): Promise<string[]> {
    const rows = this.getActionRows();
    const count = await rows.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const nameCell = rows.nth(i).locator('td').first();
      names.push(await nameCell.textContent());
    }
    return names;
  }

  /**
   * Find a row by action name; returns null if not found
   */
  async findActionByName(name: string): Promise<Locator | null> {
    const rows = this.getActionRows();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const nameCell = rows.nth(i).locator('td').first();
      const text = await nameCell.textContent();
      if (text?.trim() === name.trim()) {
        return rows.nth(i);
      }
    }
    return null;
  }

  /**
   * Open the "Ver" (eye icon) action for a named action
   */
  async clickVerAction(name: string): Promise<void> {
    const row = await this.findActionByName(name);
    if (!row) throw new Error(`Action row not found: ${name}`);

    // Open the dropdown and click Ver
    await row.locator('[data-testid="more-actions"]').or(
      row.locator('button:has([data-lucide="more-horizontal"])')
    ).click();
    await this.page.waitForTimeout(300);

    const verLink = this.page.locator('a:has([data-lucide="eye"])', { hasText: 'Ver' });
    await verLink.click();
    await this.page.waitForURL(/\/acciones\/[a-f0-9-]+$/, { timeout: 15000 });
  }

  /**
   * Open the "Editar" (edit icon) action for a named action
   */
  async clickEditarAction(name: string): Promise<void> {
    const row = await this.findActionByName(name);
    if (!row) throw new Error(`Action row not found: ${name}`);

    await row.locator('[data-testid="more-actions"]').or(
      row.locator('button:has([data-lucide="more-horizontal"])')
    ).click();
    await this.page.waitForTimeout(300);

    const editarLink = this.page.locator('a:has([data-lucide="edit"])', { hasText: 'Editar' });
    await editarLink.click();
    await this.page.waitForURL(/\/acciones\/[a-f0-9-]+\/editar/, { timeout: 15000 });
  }

  // ── Detail/create page ───────────────────────────────────────────────────────

  /**
   * Navigate to the new action form: /acciones/nuevo
   */
  async gotoNew(): Promise<void> {
    await this.page.goto('/acciones/nuevo');
    await this.page.waitForSelector('form', { state: 'visible', timeout: 15000 });
  }

  /**
   * Navigate to the edit page for a given action id: /acciones/${id}/editar
   */
  async gotoEdit(id: string): Promise<void> {
    await this.page.goto(`/acciones/${id}/editar`);
    await this.page.waitForSelector('form', { state: 'visible', timeout: 15000 });
  }

  /**
   * Fill the Name input field (Datos Básicos tab is active by default)
   */
  async fillName(name: string): Promise<void> {
    const input = this.page.locator('input[placeholder="Nombre de la acción"]');
    await input.clear();
    await input.fill(name);
  }

  /**
   * Fill the Status select (Estado field in Datos Básicos)
   */
  async fillStatus(status: string): Promise<void> {
    // The status Select is inside Datos Básicos tab content
    const trigger = this.page.locator('label:has-text("Estado")').locator('..').locator('[role="combobox"]');
    await trigger.click();
    await this.page.locator('[role="option"]', { hasText: new RegExp(status, 'i') }).click();
  }

  /**
   * Toggle an axis button (GOB, INN, TEC, SOST, ACC) in the Clasificación tab
   */
  async toggleAxis(axis: string): Promise<void> {
    // Switch to Clasificación tab
    await this.page.locator('button[role="tab"]:has-text("Clasificación")').click();
    await this.page.waitForTimeout(500);

    const axisBtn = this.page.locator('button', { hasText: new RegExp(axis, 'i') });
    await axisBtn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Toggle a scope button by scope acronym/name in the Clasificación tab
   */
  async toggleScope(scopeName: string): Promise<void> {
    // Ensure Clasificación tab is active
    const clasTab = this.page.locator('button[role="tab"]:has-text("Clasificación")');
    const isActive = await clasTab.getAttribute('aria-selected');
    if (isActive !== 'true') {
      await clasTab.click();
      await this.page.waitForTimeout(300);
    }

    const scopeBtn = this.page.locator('button', { hasText: new RegExp(scopeName, 'i') });
    await scopeBtn.click();
  }

  /**
   * Fill start date (Temporal tab)
   */
  async fillStartDate(date: string): Promise<void> {
    await this.page.locator('button[role="tab"]:has-text("Temporal")').click();
    await this.page.waitForTimeout(300);
    const input = this.page.locator('input[type="date"]').first();
    await input.fill(date);
  }

  /**
   * Fill end date (Temporal tab)
   */
  async fillEndDate(date: string): Promise<void> {
    await this.page.locator('button[role="tab"]:has-text("Temporal")').click();
    await this.page.waitForTimeout(300);
    const inputs = this.page.locator('input[type="date"]');
    await inputs.nth(1).fill(date);
  }

  /**
   * Fill the responsible person field (Responsables tab)
   */
  async fillResponsiblePerson(name: string): Promise<void> {
    await this.page.locator('button[role="tab"]:has-text("Responsables")').click();
    await this.page.waitForTimeout(300);
    const input = this.page.locator('label:has-text("Persona responsable")').locator('..').locator('input');
    await input.clear();
    await input.fill(name);
  }

  /**
   * Fill the description textarea (Temporal tab, Descripción implementación)
   */
  async fillDescription(text: string): Promise<void> {
    await this.page.locator('button[role="tab"]:has-text("Temporal")').click();
    await this.page.waitForTimeout(300);
    const textarea = this.page.locator('textarea').first();
    await textarea.clear();
    await textarea.fill(text);
  }

  /**
   * Submit the form — clicks "Crear Acción" or "Guardar Cambios"
   */
  async submit(): Promise<void> {
    const submitBtn = this.page.locator('button[type="submit"]', {
      hasText: /Crear Acción|Guardar Cambios/,
    });

    // Set up dialog handler BEFORE clicking (to catch success/error alerts)
    const dialogPromise = this.page.waitForEvent('dialog', { timeout: 5000 }).catch(() => null);

    await submitBtn.click();

    // Wait for navigation after create (redirect to /acciones/${id})
    // or alert + reload after edit
    await this.page.waitForURL(/\/acciones\/[a-f0-9-]+/, { timeout: 15000 }).catch(() => {
      // For edit, we may stay on the same page
    });

    // Accept any dialog that appeared
    const dialog = await dialogPromise;
    if (dialog) {
      await dialog.accept();
    }
  }

  // ── Good Practice section (only on edit page with action loaded) ────────────

  /**
   * Returns true if we're on the edit page (URL contains /editar)
   */
  async isOnEditPage(): Promise<boolean> {
    return this.page.url().includes('/editar');
  }

  /**
   * Returns true if the Buena Práctica DTI card is visible
   */
  async hasGoodPracticeSection(): Promise<boolean> {
    const card = this.page.locator('text=Buena Práctica DTI').first();
    return card.isVisible();
  }

  /**
   * Returns true if a good practice has been designated (gp object exists)
   */
  async isDesignatedAsBP(): Promise<boolean> {
    // Look for the "Designar como Buena Práctica" button — if it's NOT visible,
    // the action is already designated (or approved/rejected)
    const designateBtn = this.page.locator('button:has-text("Designar como Buena Práctica")');
    return !(await designateBtn.isVisible());
  }

  /**
   * Click "Designar como Buena Práctica" button
   */
  async designateAsBP(): Promise<void> {
    const btn = this.page.locator('button:has-text("Designar como Buena Práctica")');
    await btn.click();
    // Wait for the UI to update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click "Aprobar" button in the good practice section
   */
  async approveBP(): Promise<void> {
    const btn = this.page.locator('button:has-text("Aprobar")');
    await btn.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click "Rechazar" button in the good practice section
   */
  async rejectBP(): Promise<void> {
    const btn = this.page.locator('button:has-text("Rechazar")');
    await btn.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get the good practice status badge text.
   * Returns 'Aprobada', 'Rechazada', 'Designada', or null if no badge visible.
   */
  async getBPStatus(): Promise<string | null> {
    // The badge is inside the Buena Práctica DTI card
    const card = this.page.locator('text=Buena Práctica DTI').first();
    if (!(await card.isVisible())) return null;

    const badge = this.page.locator('[role="status"]', { hasText: /Aprobada|Rechazada|Designada/ }).first();
    if (!(await badge.isVisible())) return null;

    const text = await badge.textContent();
    if (text?.includes('Aprobada')) return 'Aprobada';
    if (text?.includes('Rechazada')) return 'Rechazada';
    if (text?.includes('Designada')) return 'Designada';
    return null;
  }
}
