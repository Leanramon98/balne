// Translation Corrections API — Frontend-only MVP (localStorage)
// API-shaped interface — swap each function for fetch() when backend is ready.
// Backend contract: GET/POST/PUT/DELETE /admin/translations

export const TRANSLATION_LOCALES = {
  ES: 'es',
  PT: 'pt',
} as const;

export type TranslationLocale = (typeof TRANSLATION_LOCALES)[keyof typeof TRANSLATION_LOCALES];

export interface TranslationOverride {
  id: string;
  locale: TranslationLocale;
  source_text: string;
  corrected_text: string;
  updated_at: string;
  namespace?: string;
  key?: string;
  override_value?: string;
  reason?: string;
  is_active?: boolean;
}

export type CreateOverride = Pick<TranslationOverride, 'locale' | 'source_text' | 'corrected_text'>;
export type UpdateOverride = Partial<CreateOverride>;

const STORAGE_KEY = 'translation_overrides';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTranslationLocale(value: unknown): value is TranslationLocale {
  return value === TRANSLATION_LOCALES.ES || value === TRANSLATION_LOCALES.PT;
}

function normalizeOverride(value: unknown): TranslationOverride | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || !isTranslationLocale(value.locale)) return null;

  const sourceText = typeof value.source_text === 'string' ? value.source_text : '';
  const correctedText = typeof value.corrected_text === 'string'
    ? value.corrected_text
    : typeof value.override_value === 'string'
      ? value.override_value
      : '';

  if (!correctedText) return null;

  const normalized: TranslationOverride = {
    id: value.id,
    locale: value.locale,
    source_text: sourceText,
    corrected_text: correctedText,
    updated_at: typeof value.updated_at === 'string' ? value.updated_at : new Date().toISOString(),
  };

  if (typeof value.namespace === 'string') normalized.namespace = value.namespace;
  if (typeof value.key === 'string') normalized.key = value.key;
  if (typeof value.override_value === 'string') normalized.override_value = value.override_value;
  if (typeof value.reason === 'string') normalized.reason = value.reason;
  if (typeof value.is_active === 'boolean') normalized.is_active = value.is_active;

  return normalized;
}

function readAll(): TranslationOverride[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeOverride).filter((item): item is TranslationOverride => item !== null);
  } catch {
    return [];
  }
}

function persist(items: TranslationOverride[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Get all overrides, optionally filtered by locale. */
export function getAll(locale?: string): TranslationOverride[] {
  const all = readAll();
  return locale ? all.filter((o) => o.locale === locale) : all;
}

/** Get active corrections for a locale. Missing active flags are treated as active for new records. */
export function getActive(locale: string): TranslationOverride[] {
  return getAll(locale).filter((o) => o.is_active !== false);
}

/** Create a new override. */
export function create(data: CreateOverride): TranslationOverride {
  const all = readAll();
  const override: TranslationOverride = {
    ...data,
    id: generateId(),
    updated_at: new Date().toISOString(),
  };
  all.push(override);
  persist(all);
  return override;
}

/** Update an existing override. Returns the updated override. */
export function update(id: string, data: UpdateOverride): TranslationOverride {
  const all = readAll();
  const idx = all.findIndex((o) => o.id === id);
  if (idx === -1) throw new Error(`TranslationOverride ${id} not found`);
  all[idx] = { ...all[idx], ...data, updated_at: new Date().toISOString() };
  persist(all);
  return all[idx];
}

/** Remove an override by id. */
export function remove(id: string): void {
  const all = readAll();
  persist(all.filter((o) => o.id !== id));
}
