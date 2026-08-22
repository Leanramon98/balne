import type { BalnearioPlan, PlanUnit, PlanUnitStatus } from './model';

const STATUS_SEQUENCE: PlanUnitStatus[] = ['available', 'available', 'occupied', 'available', 'held', 'available', 'maintenance', 'available'];
const patios = [
  { id: 'patio-norte', label: 'Patio Norte', y: 220, color: '#0e7490' },
  { id: 'patio-central', label: 'Patio Central', y: 465, color: '#2563eb' },
  { id: 'patio-sur', label: 'Patio Sur', y: 710, color: '#7c3aed' },
] as const;

function unit(number: number, geometry: PlanUnit['geometry'], zoneId: string): PlanUnit {
  return {
    id: `la-serena-unidad-${String(number).padStart(3, '0')}`,
    label: `Unidad ${number}`,
    number,
    geometry,
    zoneId,
    capacity: number <= 12 ? 4 : 6,
    tariffId: number <= 12 ? 'sombrilla-frente' : 'carpa-playa',
    status: STATUS_SEQUENCE[(number - 1) % STATUS_SEQUENCE.length],
  };
}

function horizontal(start: number, y: number, count: number, zoneId: string) {
  return Array.from({ length: count }, (_, index) => unit(start + index, { kind: 'rect', x: 160 + index * 40, y, width: 29, height: 18, rx: 3 }, zoneId));
}

function vertical(start: number, x: number, y: number, count: number, zoneId: string) {
  return Array.from({ length: count }, (_, index) => unit(start + index, { kind: 'rect', x, y: y + index * 27, width: 20, height: 18, rx: 3 }, zoneId));
}

function patioColumns(start: number, patio: (typeof patios)[number]) {
  const xs = [300, 330, 670, 700];
  return xs.flatMap((x, group) => vertical(start + group * 13, x, patio.y + 4, 13, patio.id));
}

/**
 * Clean vector reconstruction of the supplied raster reference. Coordinates are
 * intentionally isolated here so verified source artwork can replace them later.
 */
export const laSerenaPlan: BalnearioPlan = {
  id: 'la-serena',
  venueName: 'La Serena',
  location: 'Frente al mar',
  viewBox: { width: 1000, height: 1160 },
  zones: [
    { id: 'acceso', label: 'Acceso y filas superiores', color: '#0f766e', description: 'Filas horizontales y laterales del acceso' },
    ...patios.map((patio) => ({ id: patio.id, label: patio.label, color: patio.color, description: `Columnas verticales junto a ${patio.label.toLowerCase()}` })),
    { id: 'frente-mar', label: 'Frente al mar', color: '#0284c7', description: 'Sombrillas circulares de primera línea' },
  ],
  tariffs: [
    { id: 'carpa-playa', label: 'Carpa de playa', dailyPrice: 98000 },
    { id: 'sombrilla-frente', label: 'Sombrilla frente al mar', dailyPrice: 76000 },
  ],
  landmarks: [
    { id: 'acceso-principal', label: 'Acceso principal', kind: 'service', geometry: { kind: 'rect', x: 400, y: 42, width: 200, height: 56, rx: 10 }, detail: 'Ingreso y recepción' },
    ...patios.map((patio) => ({ id: patio.id, label: patio.label, kind: 'patio' as const, geometry: { kind: 'rect' as const, x: 385, y: patio.y, width: 230, height: 195, rx: 24 } })),
    { id: 'sea-edge', label: 'Mar', kind: 'sea-edge', geometry: { kind: 'path', d: 'M 0 1050 C 110 1018 220 1080 340 1044 S 570 1018 685 1052 S 860 1084 1000 1040 L 1000 1160 L 0 1160 Z' }, labelPosition: { x: 500, y: 1105 } },
  ],
  units: [
    ...horizontal(101, 118, 17, 'acceso'),
    ...horizontal(118, 150, 17, 'acceso'),
    ...vertical(135, 115, 220, 20, 'acceso'),
    ...vertical(155, 865, 220, 20, 'acceso'),
    ...patioColumns(175, patios[0]),
    ...patioColumns(227, patios[1]),
    ...patioColumns(279, patios[2]),
    ...horizontal(331, 970, 4, 'frente-mar'),
    ...Array.from({ length: 12 }, (_, index) => unit(index + 1, { kind: 'circle', cx: 275 + index * 41, cy: 1015, r: 13 }, 'frente-mar')),
  ],
};
