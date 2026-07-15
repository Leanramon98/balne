'use client';

import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CycleFlowDiagram } from '@/components/molecules/CycleFlowDiagram';
import { CycleStateCard } from '@/components/molecules/CycleStateCard';
import { getEvaluations } from '@/sdk/api/evaluations-api';
import type { Evaluation, EvaluationType, EvaluationStatus } from '@/types';

type CycleStatus = 'done' | 'pending' | 'in_progress';

interface CycleStates {
  autodiagnostico: CycleStatus;
  diagnostico: CycleStatus;
  auditoria: CycleStatus;
}

interface NuevaEvalHelperAsideProps {
  destino?: { id: string; name: string } | null;
}

const IN_PROGRESS_STATUSES: EvaluationStatus[] = ['en_curso', 'carga_finalizada', 'en_evaluacion'];

function deriveState(evals: Evaluation[], tipo: EvaluationType): CycleStatus {
  const match = evals.find((e) => e.type === tipo);
  if (!match) return 'pending';
  if (match.status === 'cerrada') return 'done';
  if (IN_PROGRESS_STATUSES.includes(match.status)) return 'in_progress';
  return 'pending'; // borrador or other
}

export function NuevaEvalHelperAside({ destino }: NuevaEvalHelperAsideProps) {
  const [cycleStates, setCycleStates] = useState<CycleStates | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const t = useTranslations('evaluation');

  useEffect(() => {
    if (!destino?.id) {
      setCycleStates(undefined);
      return;
    }

    setLoading(true);
    getEvaluations({ destination_id: destino.id })
      .then(({ data: evals }) => {
        setCycleStates({
          autodiagnostico: deriveState(evals, 'autodiagnostico'),
          diagnostico: deriveState(evals, 'diagnostico'),
          auditoria: deriveState(evals, 'auditoria'),
        });
      })
      .catch(() => {
        setCycleStates(undefined);
      })
      .finally(() => setLoading(false));
  }, [destino?.id]);

  return (
    <div className="flex flex-col gap-4">
      {/* Card 1: Ciclo de evaluación DTI */}
      <div className="bg-white border border-zinc-200 rounded-[12px] p-5">
        <h3 className="text-sm font-semibold text-zinc-900">{t('cycle.title')}</h3>
        <p className="text-xs text-zinc-500 mt-1">
          {t('cycle.description')}
        </p>
        <div className="mt-4">
          <CycleFlowDiagram />
        </div>
        <div className="mt-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 bg-zinc-100 rounded" />
              <div className="h-8 bg-zinc-100 rounded" />
              <div className="h-8 bg-zinc-100 rounded" />
            </div>
          ) : (
            <CycleStateCard destino={destino} states={cycleStates} />
          )}
        </div>
      </div>

      {/* Card 2: Info note */}
      <div className="bg-blue-50 border border-blue-100 rounded-[10px] p-4 flex items-start gap-3">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-600">
          {t('cycle.info-note')}
        </p>
      </div>
    </div>
  );
}
