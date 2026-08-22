import type { BalnearioPlan, PlanUnit, PlanUnitStatus } from './model';

const PATIOS = [
  { id: 'patio-1', label: 'Patio 1', x: 150, y: 315 },
  { id: 'patio-2', label: 'Patio 2', x: 390, y: 315 },
  { id: 'patio-3', label: 'Patio 3', x: 630, y: 315 },
  { id: 'patio-4', label: 'Patio 4', x: 270, y: 585 },
  { id: 'patio-5', label: 'Patio 5', x: 570, y: 585 },
] as const;

const STATUS_SEQUENCE: PlanUnitStatus[] = [
  'available', 'available', 'available', 'occupied', 'available', 'held',
  'available', 'occupied', 'available', 'available', 'maintenance', 'available',
];

function patioUnits(patio: (typeof PATIOS)[number], patioIndex: number): PlanUnit[] {
  const units: PlanUnit[] = [];
  const positions = [
    ...Array.from({ length: 8 }, (_, index) => ({ x: patio.x + 12 + index * 21, y: patio.y - 30 })),
    ...Array.from({ length: 7 }, (_, index) => ({ x: patio.x + 12 + index * 21, y: patio.y + 138 })),
    ...Array.from({ length: 8 }, (_, index) => ({ x: patio.x - 30, y: patio.y + 12 + index * 15 })),
    ...Array.from({ length: 7 }, (_, index) => ({ x: patio.x + 178, y: patio.y + 12 + index * 17 })),
  ];

  return positions.map((position, index) => {
    const number = patioIndex * 30 + index + 1;
    return {
      id: `cocodrilo-carpa-${String(number).padStart(3, '0')}`,
      label: `Carpa ${number}`,
      number,
      geometry: { kind: 'rect', x: position.x, y: position.y, width: 17, height: 12, rx: 2 },
      zoneId: patio.id,
      capacity: 6,
      tariffId: 'carpa-standard',
      status: STATUS_SEQUENCE[(number - 1) % STATUS_SEQUENCE.length],
    };
  });
}

/**
 * Vector reconstruction from the supplied visual reference. It is intentionally
 * data-first so a surveyed PDF/SVG can replace coordinates without changing UI.
 */
export const cocodriloPinamarPlan: BalnearioPlan = {
  id: 'cocodrilo-pinamar',
  venueName: 'Cocodrilo Pinamar',
  location: 'Pinamar, Buenos Aires',
  viewBox: { width: 1000, height: 900 },
  zones: PATIOS.map((patio, index) => ({
    id: patio.id,
    label: patio.label,
    color: ['#0f766e', '#0e7490', '#2563eb', '#7c3aed', '#be123c'][index],
    description: `Carpas alrededor de ${patio.label.toLowerCase()}`,
  })),
  tariffs: [
    { id: 'carpa-standard', label: 'Carpa estándar', dailyPrice: 98000 },
  ],
  landmarks: [
    { id: 'restaurant', label: 'Restaurante Cocodrilo', kind: 'landmark', geometry: { kind: 'rect', x: 80, y: 70, width: 390, height: 110, rx: 12 } },
    { id: 'access', label: 'Acceso principal', kind: 'service', geometry: { kind: 'rect', x: 500, y: 70, width: 170, height: 110, rx: 12 }, detail: 'Recepción y acceso' },
    { id: 'pool', label: 'Piscina', kind: 'landmark', geometry: { kind: 'rect', x: 710, y: 70, width: 210, height: 160, rx: 36 } },
    { id: 'service', label: 'Servicios', kind: 'service', geometry: { kind: 'rect', x: 760, y: 285, width: 150, height: 115, rx: 12 }, detail: 'Baños y apoyo' },
    ...PATIOS.map((patio) => ({ id: patio.id, label: patio.label, kind: 'patio' as const, geometry: { kind: 'rect' as const, x: patio.x, y: patio.y, width: 165, height: 120, rx: 28 } })),
    { id: 'sea-edge', label: 'Mar Argentino', kind: 'sea-edge', geometry: { kind: 'path', d: 'M 0 805 C 90 775 155 840 250 805 S 420 770 520 805 S 690 840 790 805 S 925 770 1000 800 L 1000 900 L 0 900 Z' } },
  ],
  units: PATIOS.flatMap(patioUnits),
};
