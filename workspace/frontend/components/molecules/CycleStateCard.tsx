'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

type CycleStatus = 'done' | 'pending' | 'in_progress';

interface CycleStates {
  autodiagnostico: CycleStatus;
  diagnostico: CycleStatus;
  auditoria: CycleStatus;
}

interface CycleStateCardProps {
  destino?: { id: string; name: string } | null;
  states?: CycleStates;
}

const DEFAULT_STATES: CycleStates = {
  autodiagnostico: 'pending',
  diagnostico: 'pending',
  auditoria: 'pending',
};

const STATUS_CONFIG: Record<CycleStatus, { className: string }> = {
  done: { className: 'bg-green-50 text-green-700' },
  in_progress: { className: 'bg-blue-50 text-blue-700' },
  pending: { className: 'bg-zinc-100 text-zinc-500' },
};

const ROW_KEYS: (keyof CycleStates)[] = [
  'autodiagnostico',
  'diagnostico',
  'auditoria',
];

export function CycleStateCard({ destino, states }: CycleStateCardProps) {
  const dt = useTranslations('display-names');
  const t = useTranslations('evaluation');

  if (!destino) {
    return (
      <p className="text-xs text-zinc-400 italic">
        {t('cycle.select-destination')}
      </p>
    );
  }

  const resolved = states ?? DEFAULT_STATES;

  return (
    <div>
      {ROW_KEYS.map((key) => {
        const status = resolved[key];
        const config = STATUS_CONFIG[status];
        return (
          <div
            key={key}
            className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0"
          >
            <span className="text-sm font-medium text-zinc-700">{dt(`eval-type.${key}` as any)}</span>
            <span
              className={[
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                config.className,
              ].join(' ')}
            >
              {t(`cycle.status.${status}`)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
