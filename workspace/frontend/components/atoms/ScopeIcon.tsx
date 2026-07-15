'use client';

import { cn } from '@/lib/utils';
import { getScopeIcon } from '@/lib/scope-icons';
import { FileText } from 'lucide-react';

const AXIS_COLORS: Record<string, string> = {
  gob: 'text-blue-600 bg-blue-50',
  inn: 'text-purple-600 bg-purple-50',
  tec: 'text-cyan-600 bg-cyan-50',
  sost: 'text-green-600 bg-green-50',
  acc: 'text-orange-600 bg-orange-50',
};

const SIZE_MAP: Record<string, { container: string; iconSize: number }> = {
  sm: { container: 'h-8 w-8', iconSize: 16 },
  md: { container: 'h-10 w-10', iconSize: 20 },
  lg: { container: 'h-12 w-12', iconSize: 24 },
};

export const ACRONYM_TO_AXIS: Record<string, string> = {
  ORG: 'gob',
  FIN: 'gob',
  PLA: 'gob',
  GEST: 'gob',
  ECO: 'inn',
  DAT: 'inn',
  EXP: 'inn',
  INF: 'tec',
  CON: 'tec',
  SEN: 'tec',
  PLAT: 'tec',
  MED: 'sost',
  SOC: 'sost',
  ECON: 'sost',
  ACC_FIS: 'acc',
  ACC_DIG: 'acc',
};

interface ScopeIconProps {
  icon?: string;
  axis?: string;
  size?: 'sm' | 'md' | 'lg';
  acronym?: string;
  order?: number;
}

export function ScopeIcon({ icon, axis, size = 'md', acronym, order }: ScopeIconProps) {
  const resolvedAxis = axis || (acronym ? ACRONYM_TO_AXIS[acronym.toUpperCase()] : undefined);
  const colorClasses = AXIS_COLORS[resolvedAxis?.toLowerCase() ?? ''] ?? 'text-gray-600 bg-gray-50';
  const { container, iconSize } = SIZE_MAP[size];

  // 1. Try lucide icon from DB `icon` field
  if (icon) {
    const IconComponent = getScopeIcon(icon);
    if (IconComponent) {
      return (
        <div
          className={cn(
            'inline-flex items-center justify-center rounded-lg shrink-0',
            colorClasses,
            container,
          )}
        >
          <IconComponent className="text-current" size={iconSize} />
        </div>
      );
    }
  }

  // 2. Fallback: first letter of acronym
  const fallbackChar = acronym ? acronym.charAt(0).toUpperCase() : null;
  if (fallbackChar) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-bold uppercase shrink-0',
          colorClasses,
          container,
        )}
      >
        <span style={{ fontSize: Math.round(iconSize * 0.8) }}>{fallbackChar}</span>
      </div>
    );
  }

  // 3. Ultimate fallback
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg shrink-0',
        colorClasses,
        container,
      )}
    >
      <FileText className="text-current" size={iconSize} />
    </div>
  );
}
