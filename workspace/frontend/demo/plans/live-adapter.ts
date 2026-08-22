// Adapter: converts bookings-service API responses into the BalnearioPlan
// shape consumed by the <BalnearioPlan /> SVG component.
// The fixture model (see ./model.ts) uses rich geometry + landmarks/zones; the
// API returns flat plan_units with position_x/y/width/height/shape. This module
// keeps the SVG rendering path identical for both live and demo data.

import type {
  BookingsBalneario,
  BookingsPlanUnit,
  PlanUnitShape,
  PlanUnitStatus,
} from '@/sdk/api/bookings-api';
import type {
  BalnearioPlan,
  PlanGeometry,
  PlanUnit,
  PlanZone,
} from './model';

const ZONE_COLORS = [
  '#0f766e',
  '#0e7490',
  '#2563eb',
  '#7c3aed',
  '#be123c',
  '#a16207',
  '#4338ca',
];

function zoneColor(zone: string, index: number): string {
  return ZONE_COLORS[index % ZONE_COLORS.length];
}

function toGeometry(unit: BookingsPlanUnit): PlanGeometry {
  if (unit.shape === 'circle') {
    return {
      kind: 'circle',
      cx: unit.position_x + unit.width / 2,
      cy: unit.position_y + unit.height / 2,
      r: Math.min(unit.width, unit.height) / 2,
    };
  }
  return {
    kind: 'rect',
    x: unit.position_x,
    y: unit.position_y,
    width: unit.width,
    height: unit.height,
    rx: 4,
  };
}

function parseUnitNumber(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Convert API PlanUnit[] into the PlanUnit[] shape used by <BalnearioPlan />.
 * Pure function — no network, no side effects.
 */
export function adaptPlanUnits(units: BookingsPlanUnit[]): PlanUnit[] {
  return units.map((unit) => ({
    id: unit.id,
    label: `Unidad ${unit.unit_number}`,
    number: parseUnitNumber(unit.unit_number),
    geometry: toGeometry(unit),
    zoneId: unit.zone,
    capacity: unit.capacity,
    tariffId: 'live-default',
    status: unit.status as PlanUnitStatus,
  }));
}

/**
 * Build a full BalnearioPlan from a live balneario + its plan units.
 * Zones are derived from the distinct zones present in the unit list.
 * The viewBox is computed from the units' bounding box so every unit is visible.
 * Landmarks are empty because the public API does not expose them yet.
 */
export function buildLivePlan(
  balneario: BookingsBalneario,
  units: BookingsPlanUnit[],
): BalnearioPlan {
  const adapted = adaptPlanUnits(units);

  const zones: PlanZone[] = Array.from(new Set(units.map((u) => u.zone))).map(
    (zone, index) => ({
      id: zone,
      label: `Zona ${zone}`,
      color: zoneColor(zone, index),
      description: `Unidades de la zona ${zone}`,
    }),
  );

  const maxX = units.reduce((max, u) => Math.max(max, u.position_x + u.width), 0);
  const maxY = units.reduce((max, u) => Math.max(max, u.position_y + u.height), 0);
  const padding = 80;
  const viewBox = {
    width: Math.max(maxX + padding, 640),
    height: Math.max(maxY + padding, 420),
  };

  return {
    id: balneario.slug,
    venueName: balneario.name,
    location: balneario.location,
    viewBox,
    zones,
    tariffs: [{ id: 'live-default', label: 'Tarifa estándar', dailyPrice: 0 }],
    landmarks: [],
    units: adapted,
  };
}

/**
 * Merge live units into an existing fixture plan. Useful when callers want to
 * keep the fixture's landmarks/visual scaffolding but swap in real availability.
 * Not used by the default flow but exposed for plan-editor scenarios.
 */
export function mergeLiveUnitsIntoPlan(
  base: BalnearioPlan,
  units: BookingsPlanUnit[],
): BalnearioPlan {
  return {
    ...base,
    units: adaptPlanUnits(units),
  };
}

export type { PlanUnitShape };
