'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CycleFlowDiagramProps {
  className?: string;
}

const STEP_KEYS = [
  'autodiagnostico',
  'diagnostico',
  'auditoria',
] as const;

export function CycleFlowDiagram({ className }: CycleFlowDiagramProps) {
  const dt = useTranslations('display-names');

  return (
    <div className={['flex items-start justify-center gap-3', className].filter(Boolean).join(' ')}>
      {STEP_KEYS.map((key, idx) => (
        <React.Fragment key={key}>
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-zinc-900 text-white text-sm font-bold grid place-items-center text-center shrink-0 leading-none tabular-nums">
              {idx + 1}
            </div>
            <span className="text-xs text-zinc-600 text-center mt-1 font-medium">{dt(`eval-type.${key}` as any)}</span>
          </div>
          {idx < STEP_KEYS.length - 1 && (
            <ChevronRight size={16} className="text-zinc-300 mt-2 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
