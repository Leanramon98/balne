import type { Page, Locator } from '@playwright/test';

export type AdminTab = 'Usuarios' | 'Destinos' | 'Ámbitos' | 'Indicadores';

export interface UserFormData {
  name: string;
  email: string;
  role: string;
  destinationId?: string;
  password?: string;
}

export interface DestinationFormData {
  name: string;
  country?: string;
  subnationalLevelId?: string;
  memberTypeId?: string;
  typologyId?: string;
  populationRangeId?: string;
  regionId?: string;
  lat?: string;
  lng?: string;
  isAdhered?: boolean;
}

export interface ScopeFormData {
  name: string;
  acronym: string;
  description?: string;
  axis?: string;
  icon?: string;
  sortOrder?: number;
}

export interface IndicatorStep1Data {
  requirementId: string;
  levelId: string;
  typology: string;
  classification: string;
  name: string;
  description?: string;
  requirementDescription?: string;
  code?: string;
}

export interface IndicatorStep2Data {
  type?: 'gradient' | 'boolean' | 'numeric';
  tags?: string[];
}

export interface IndicatorStep3Data {
  mappingType?: 'default' | 'defined';
}

/**
 * Page Object Model for the admin configuration screen (`/configuracion`).
 *
 * Provides tab navigation and form helpers for Users, Destinations, Scopes,
 * and the Indicators 3-step wizard.
 */
const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  admin_destino: 'Admin. Destino',
  gestor_destino: 'Gestor Destino',
  consultor: 'Consultor',
  auditor: 'Auditor',
  gestor_regional: 'Gestor Regional',
  gestor_nacional: 'Gestor Nacional',
};

const AXIS_LABELS: Record<string, string> = {
  gob: 'GOB',
  inn: 'INN',
  tec: 'TEC',
  sost: 'SOST',
  acc: 'ACC',
};

const TYPOLOGY_LABELS: Record<string, string> = {
  obligatorio: 'Obligatorio',
  opcional: 'Opcional',
};

const INDICATOR_TYPE_LABELS: Record<string, string> = {
  gradient: 'Gradiente (0/25/50/75/100)',
  boolean: 'Sí / No',
  numeric: 'Numérico',
};

export class AdminConfigPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto('/configuracion');
    await this.page.locator('h1:has-text("Configuración")').waitFor({ state: 'visible' });
  }

  async switchTab(tabName: AdminTab) {
    const tab = this.page.getByRole('tab', { name: tabName, exact: true });
    await tab.click();
    // Wait for the tab panel to render its primary heading/card title.
    const heading = tabName === 'Ámbitos' ? 'Ámbitos' : tabName;
    await this.page.locator(`text=${heading}`).first().waitFor({ state: 'visible' });
    // Give the table a moment to populate via SWR.
    await this.page.locator('table').first().waitFor({ state: 'visible' });
  }

  // ── Users ────────────────────────────────────────────────────────────────

  async openCreateUser() {
    await this.page.getByRole('button', { name: 'Nuevo Usuario' }).click();
    await this.page.locator('[role="dialog"]').waitFor({ state: 'visible' });
  }

  async fillUserForm({ name, email, role, destinationId, password }: UserFormData) {
    await this.selectByLabel('Perfil', ROLE_LABELS[role] ?? role);
    await this.fillByLabel('Nombre', name);
    await this.fillByLabel('Email', email);

    if (destinationId) {
      await this.selectByLabel('Destino', destinationId);
    }

    if (password) {
      // The password field is read-only and auto-generated; setting it via the
      // DOM keeps the visible value in sync but the form uses its own state.
      // In practice tests rely on the auto-generated password.
      const passwordInput = this.page.locator('div:has(> label:has-text("Contraseña")) input').first();
      if (await passwordInput.isVisible().catch(() => false)) {
        await passwordInput.evaluate((el: HTMLInputElement, val: string) => { el.value = val; }, password);
      }
    }
  }

  async saveUser() {
    await this.page.getByRole('button', { name: /Crear Usuario|Actualizar Usuario/ }).click();
    await this.page.locator('[role="dialog"]').waitFor({ state: 'hidden' });
  }

  findUserRow(email: string): Locator {
    return this.page.locator('table tbody tr').filter({
      has: this.page.locator('td', { hasText: email }),
    });
  }

  async openEditUser(email: string) {
    const row = this.findUserRow(email);
    await row.locator('button[title="Editar"]').click();
    await this.page.locator('[role="dialog"]').waitFor({ state: 'visible' });
  }

  async clickResetPassword(email: string) {
    const row = this.findUserRow(email);
    await row.locator('button[title="Restaurar contraseña"]').click();
  }

  // ── Destinations ─────────────────────────────────────────────────────────

  async openCreateDestination() {
    await this.page.getByRole('button', { name: 'Nuevo Destino' }).click();
    await this.page.locator('[role="dialog"]').waitFor({ state: 'visible' });
  }

  async fillDestinationForm(data: DestinationFormData) {
    await this.fillByLabel('Nombre', data.name);
    if (data.country) await this.fillByLabel('País', data.country);
    if (data.subnationalLevelId) await this.selectByLabel('Nivel subnacional', data.subnationalLevelId);
    if (data.memberTypeId) await this.selectByLabel('Miembros', data.memberTypeId);
    if (data.typologyId) await this.selectByLabel('Tipología', data.typologyId);
    if (data.populationRangeId) await this.selectByLabel('Rango de población', data.populationRangeId);
    if (data.regionId) await this.selectByLabel('Región', data.regionId);
    if (data.lat) await this.fillByLabel('Latitud', data.lat);
    if (data.lng) await this.fillByLabel('Longitud', data.lng);
    if (data.isAdhered !== undefined) {
      const checkbox = this.page.locator('input#adherido');
      const checked = await checkbox.isChecked().catch(() => false);
      if (checked !== data.isAdhered) {
        await checkbox.click().catch(() => { /* dialog may have closed */ });
      }
    }
  }

  async saveDestination() {
    await this.page.getByRole('button', { name: /Crear Destino|Actualizar Destino/ }).click();
    await this.page.locator('[role="dialog"]').waitFor({ state: 'hidden' });
  }

  findDestinationRow(name: string): Locator {
    return this.page.locator('table tbody tr').filter({
      has: this.page.locator('td', { hasText: name }),
    });
  }

  async openEditDestination(name: string) {
    const row = this.findDestinationRow(name);
    await row.locator('button').first().click();
    await this.page.locator('[role="dialog"]').waitFor({ state: 'visible' });
  }

  // ── Scopes ───────────────────────────────────────────────────────────────

  async openCreateScope() {
    await this.page.getByRole('button', { name: 'Nuevo Ámbito' }).click();
    await this.page.locator('[role="dialog"]').waitFor({ state: 'visible' });
  }

  async fillScopeForm({ name, acronym, description, axis = 'GOB', icon, sortOrder }: ScopeFormData) {
    await this.fillByLabel('Nombre', name);
    await this.fillByLabel('Acrónimo', acronym);
    await this.selectByLabel('Eje', AXIS_LABELS[axis] ?? axis);
    if (icon) await this.fillByLabel('Icono', icon);
    if (description) await this.fillByLabel('Descripción', description);
    if (sortOrder !== undefined) {
      const input = this.page.locator('div:has(> label:has-text("Orden")) input').first();
      await input.fill(String(sortOrder));
    }
  }

  async saveScope() {
    await this.page.getByRole('button', { name: /Guardar/ }).click();
    await this.page.locator('[role="dialog"]').waitFor({ state: 'hidden' });
  }

  findScopeRow(name: string): Locator {
    return this.page.locator('table tbody tr').filter({
      has: this.page.locator('td', { hasText: name }),
    });
  }

  // ── Indicators wizard ────────────────────────────────────────────────────

  async openCreateIndicator() {
    await this.page.getByRole('button', { name: 'Nuevo Indicador' }).click();
    await this.page.locator('[role="dialog"]').waitFor({ state: 'visible' });
  }

  async fillIndicatorStep1({
    requirementId,
    levelId,
    typology,
    classification,
    name,
    description,
    requirementDescription,
    code,
  }: IndicatorStep1Data) {
    await this.selectByLabel('Requisito', requirementId);
    await this.selectByLabel('Nivel', levelId);
    await this.selectByLabel('Tipología', TYPOLOGY_LABELS[typology] ?? typology);
    await this.fillByLabel('Clasificación', classification);
    await this.fillByLabel('Código', code || `IND-${Date.now().toString(36).toUpperCase()}`);
    await this.fillByLabel('Nombre', name);
    if (requirementDescription) await this.fillByLabel('Descripción del requisito', requirementDescription);
    if (description) await this.fillByLabel('Descripción del indicador', description);

    await this.page.getByRole('button', { name: 'Siguiente — Etiquetas' }).click();
    await this.page.locator('text=Tipo de indicador').waitFor({ state: 'visible' });
  }

  async fillIndicatorStep2({ type = 'gradient', tags }: IndicatorStep2Data = {}) {
    await this.selectByLabel('Tipo de indicador', INDICATOR_TYPE_LABELS[type] ?? type);

    if (tags && tags.length > 0) {
      for (const tag of tags) {
        const input = this.page.locator('label:has-text("Etiquetas")').locator('..').locator('input').first();
        await input.fill(tag);
        await input.press('Enter');
      }
    }

    await this.page.getByRole('button', { name: 'Siguiente — Reglas de Mapeo' }).click();
    await this.page.locator('text=Regla de Mapeo').waitFor({ state: 'visible' });
  }

  async fillIndicatorStep3({ mappingType = 'default' }: IndicatorStep3Data = {}) {
    const radio = this.page.locator(`input[name="mappingMode"][value="${mappingType}"]`);
    await radio.click();
  }

  async saveIndicator() {
    await this.page.getByRole('button', { name: 'Guardar Indicador' }).click();
    await this.page.locator('[role="dialog"]').waitFor({ state: 'hidden' });
  }

  findIndicatorRow(name: string): Locator {
    return this.page.locator('table tbody tr').filter({
      has: this.page.locator('td', { hasText: name }),
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async fillByLabel(label: string, value: string) {
    const input = this.page
      .locator(`div:has(> label:has-text("${label}")) input, div:has(> label:has-text("${label}")) textarea`)
      .first();
    await input.waitFor({ state: 'visible' });
    await input.fill(value);
  }

  private async selectByLabel(label: string, value: string) {
    const trigger = this.page.locator(`div:has(> label:has-text("${label}")) button`).first();
    await trigger.waitFor({ state: 'visible' });
    await trigger.click();
    const option = this.page.getByRole('option', { name: value });
    await option.waitFor({ state: 'visible' });
    await option.click();
  }
}
