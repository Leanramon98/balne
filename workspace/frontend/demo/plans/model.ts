export type PlanUnitStatus = 'available' | 'occupied' | 'held' | 'maintenance';

export type PlanGeometry =
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'path'; d: string }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'text'; x: number; y: number };

export interface PlanStyle {
  fill?: string;
  stroke?: string;
}

export interface PlanZone {
  id: string;
  label: string;
  color: string;
  description: string;
}

export interface PlanTariff {
  id: string;
  label: string;
  dailyPrice: number;
}

export interface PlanLandmark {
  id: string;
  label: string;
  kind: 'landmark' | 'patio' | 'sea-edge' | 'service';
  geometry: PlanGeometry;
  detail?: string;
  labelPosition?: { x: number; y: number };
  style?: PlanStyle;
}

export interface PlanUnit {
  id: string;
  label: string;
  number: number;
  geometry: PlanGeometry;
  zoneId: string;
  capacity: number;
  tariffId: string;
  status: PlanUnitStatus;
  style?: PlanStyle;
}

export interface BalnearioPlan {
  id: string;
  venueName: string;
  location: string;
  viewBox: { width: number; height: number };
  zones: PlanZone[];
  tariffs: PlanTariff[];
  landmarks: PlanLandmark[];
  units: PlanUnit[];
}
