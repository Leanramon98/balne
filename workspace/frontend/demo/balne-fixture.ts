export type DemoUnitStatus = 'available' | 'occupied' | 'held';

export interface DemoUnit {
  id: string;
  label: string;
  sector: string;
  capacity: number;
  status: DemoUnitStatus;
  tariff: number;
}

export interface DemoPeriod {
  id: string;
  label: string;
  detail: string;
  priceMultiplier: number;
}

/**
 * Local fixture for MVP demonstrations. It is intentionally not connected to
 * API contracts, persistence, payments, or production availability.
 */
export const localDemoBalneario = {
  name: 'Balneario La Marea',
  location: 'Playa Varese, Mar del Plata',
  dateLabel: 'Hoy, sábado 21 de agosto',
  periodLabel: 'Jornada completa · 09:00 a 19:00',
  currency: 'ARS',
  periods: [
    { id: 'morning', label: 'Media jornada · 09:00 a 14:00', detail: 'Mañana en la playa', priceMultiplier: 0.6 },
    { id: 'full-day', label: 'Jornada completa · 09:00 a 19:00', detail: 'El día completo frente al mar', priceMultiplier: 1 },
    { id: 'afternoon', label: 'Media jornada · 14:00 a 19:00', detail: 'Tarde de playa', priceMultiplier: 0.6 },
  ] satisfies DemoPeriod[],
  tariffs: [
    { name: 'Carpa', price: 78000, detail: 'Hasta 6 personas' },
    { name: 'Sombrilla', price: 52000, detail: 'Hasta 4 personas' },
  ],
  units: [
    { id: 'c-01', label: 'Carpa 01', sector: 'Primera línea', capacity: 6, status: 'occupied', tariff: 78000 },
    { id: 'c-02', label: 'Carpa 02', sector: 'Primera línea', capacity: 6, status: 'available', tariff: 78000 },
    { id: 'c-03', label: 'Carpa 03', sector: 'Primera línea', capacity: 6, status: 'held', tariff: 78000 },
    { id: 's-11', label: 'Sombrilla 11', sector: 'Sector Norte', capacity: 4, status: 'available', tariff: 52000 },
    { id: 's-12', label: 'Sombrilla 12', sector: 'Sector Norte', capacity: 4, status: 'available', tariff: 52000 },
    { id: 's-13', label: 'Sombrilla 13', sector: 'Sector Norte', capacity: 4, status: 'occupied', tariff: 52000 },
  ] satisfies DemoUnit[],
} as const;

export const localDemoSession = {
  user: {
    id: 'local-demo-operator',
    email: 'demo@balne.local',
    name: 'Operación local',
    roles: ['admin'],
  },
  session: {
    organization_id: 'local-demo-balne',
    membership_id: 'local-demo-operator',
    deployment_mode: 'local-demo',
    is_local_demo: true,
  },
} as const;
