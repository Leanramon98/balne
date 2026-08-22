import type { BalnearioPlan } from './model';
import { cocodriloPinamarPlan } from './cocodrilo-pinamar';
import { laSerenaPlan } from './la-serena';
import { getDraftPlan } from '@/lib/draft-plan';

export const balnearioPlans: BalnearioPlan[] = [cocodriloPinamarPlan, laSerenaPlan];

export function getBalnearioPlan(id: string | null): BalnearioPlan {
  if (!id) return cocodriloPinamarPlan;

  // 1. Check if a local draft exists for this slug
  const draft = getDraftPlan(id);
  if (draft && draft.units.length > 0) {
    return draft;
  }

  // 2. Check built-in fixture plans
  const found = balnearioPlans.find((plan) => plan.id === id);
  if (found) return found;

  // 3. Fallback: Return a clean plan for the requested slug instead of hardcoding cocodriloPinamarPlan
  return {
    id,
    venueName: id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    location: 'Ubicación personalizada',
    viewBox: { width: 1000, height: 700 },
    zones: [{ id: 'general', label: 'Zona general', color: '#0e7490', description: 'Unidades generales' }],
    tariffs: [{ id: 'standard', label: 'Tarifa estándar', dailyPrice: 78000 }],
    landmarks: [],
    units: [],
  };
}

