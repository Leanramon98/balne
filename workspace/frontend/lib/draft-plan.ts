import type { BalnearioPlan } from '@/demo/plans/model';

/**
 * Returns the localStorage key for a plan draft associated with a balneario slug.
 * The editor saves drafts here so booking pages can read them locally.
 */
export function draftKey(slug: string): string {
  return `balne-plan-draft-${slug}`;
}

/**
 * Reads a saved plan draft from localStorage for the given slug.
 * Returns null if no draft exists or if the stored data is invalid.
 *
 * This is local-only: drafts live in the browser where the editor was used.
 * They are intended for local demo/preview and are not shared or persisted to the backend.
 */
export function getDraftPlan(slug: string): BalnearioPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(draftKey(slug));
    if (!stored) return null;
    const parsed = JSON.parse(stored) as BalnearioPlan;
    if (!parsed?.viewBox || !Array.isArray(parsed.units) || !Array.isArray(parsed.landmarks)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Saves a plan draft to localStorage for the given slug.
 */
export function saveDraftPlan(slug: string, plan: BalnearioPlan): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(draftKey(slug), JSON.stringify(plan));
}

/**
 * Returns all slugs that have a saved draft plan in localStorage.
 */
export function getDraftSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  const slugs: string[] = [];
  const prefix = 'balne-plan-draft-';
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      slugs.push(key.slice(prefix.length));
    }
  }
  return slugs;
}
