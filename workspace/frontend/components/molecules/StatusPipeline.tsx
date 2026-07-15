'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { changeEvaluationStatus } from '@/sdk/api/evaluations-api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import type { EvaluationStatus } from '@/types';

const PIPELINE_KEYS = [
  'borrador',
  'en_curso',
  'carga_finalizada',
  'en_evaluacion',
  'cerrada',
] as const;

interface StatusPipelineProps {
  evaluationId: string;
  currentStatus: string;
  allowedTransitions: string[];
  onTransition: () => void;
}

export function StatusPipeline({
  evaluationId,
  currentStatus,
  allowedTransitions,
  onTransition,
}: StatusPipelineProps) {
  const [loading, setLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const dt = useTranslations('display-names');
  const ddt = useTranslations('display-names');
  const t = useTranslations('evaluation');
  const ct = useTranslations('common');

  const currentIdx = PIPELINE_KEYS.indexOf(currentStatus as any);
  const isInPipeline = currentIdx !== -1;
  const isAnulada = currentStatus === 'anulada';

  const handleClick = (status: string) => {
    if (loading || status === currentStatus) return;
    if (!allowedTransitions.includes(status)) return;
    setPendingStatus(status);
  };

  const handleConfirm = async () => {
    if (!pendingStatus) return;
    setLoading(true);
    try {
      await changeEvaluationStatus(evaluationId, pendingStatus as EvaluationStatus);
      const label = dt(`eval-status.${pendingStatus}` as any) ?? pendingStatus;
      toast.success(t('status-pipeline.changed', { status: label }));
      onTransition();
    } catch (err: any) {
      toast.error(err.message || t('status-pipeline.error'));
    } finally {
      setLoading(false);
      setPendingStatus(null);
    }
  };

  const canAnular = allowedTransitions.includes('anulada');

  return (
    <TooltipProvider>
      <>
      <div className="relative w-full">
        {/* Scroll hint gradient on mobile — indicates more content to the right */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/60 to-transparent pointer-events-none z-10 md:hidden" />
        <div className="flex items-center justify-between w-full select-none overflow-x-auto scrollbar-dti pb-2 gap-2 lg:gap-0">
        {PIPELINE_KEYS.map((key, i) => {
          const isPast = isInPipeline && i < currentIdx;
          const isCurrent = key === currentStatus;
          const isPending = isInPipeline && i > currentIdx;
          const canClick = allowedTransitions.includes(key) && !isCurrent;

          return (
            <React.Fragment key={key}>
              {/* Stage circle + label */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={!canClick || loading}
                    onClick={() => handleClick(key)}
                    className={cn(
                      'flex flex-col items-center gap-1 group',
                      !canClick && 'cursor-default',
                    )}
                  >
                    {/* Circle */}
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all',
                        isCurrent && 'ring-2 ring-offset-2 ring-blue-400',
                        isPast && 'bg-green-500 border-green-500 text-white',
                        isCurrent && 'bg-blue-500 border-blue-500 text-white',
                        isPending && 'bg-white border-zinc-300 text-zinc-400',
                        isAnulada && 'bg-zinc-100 border-zinc-300 text-zinc-400',
                        canClick && !isPast && 'border-blue-400 text-blue-600 cursor-pointer hover:bg-blue-50 hover:border-blue-500',
                      )}
                    >
                      {isPast ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    {/* Label */}
                    <span
                      className={cn(
                        'text-[11px] font-medium whitespace-nowrap transition-colors',
                        isCurrent && 'text-blue-700 font-semibold',
                        isPast && 'text-green-600',
                        isPending && 'text-zinc-400',
                        isAnulada && 'text-zinc-400',
                        canClick && !isPast && 'text-blue-600',
                      )}
                    >
                      {dt(`eval-status.${key}` as any)}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64 text-center">
                  {ddt(`eval-status-desc.${key}` as any)}
                </TooltipContent>
              </Tooltip>

              {/* Connector line between stages */}
              {i < PIPELINE_KEYS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 mb-6 rounded-full transition-colors',
                    (isPast || (isCurrent && !isAnulada)) && 'bg-green-400',
                    isPending && 'bg-zinc-200',
                    isAnulada && 'bg-zinc-200',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Anulada as a separate stage after the pipeline */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="ml-4 pl-4 border-l border-zinc-200 flex flex-col items-center gap-1">
              <button
                type="button"
                disabled={!canAnular || loading}
                onClick={() => handleClick('anulada')}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all',
                  isAnulada && 'bg-red-500 border-red-500 text-white ring-2 ring-offset-2 ring-red-400',
                  canAnular && !isAnulada && 'border-red-300 text-red-400 cursor-pointer hover:bg-red-50 hover:border-red-400',
                  !canAnular && !isAnulada && 'bg-zinc-100 border-zinc-300 text-zinc-400 cursor-default',
                )}
              >
                {isAnulada ? <Check className="h-4 w-4" /> : 'X'}
              </button>
              <span
                className={cn(
                  'text-[11px] font-medium whitespace-nowrap',
                  isAnulada && 'text-red-600 font-semibold',
                  canAnular && !isAnulada && 'text-red-400',
                  !canAnular && 'text-zinc-400',
                )}
              >
                {isAnulada ? dt('eval-status.anulada' as any) : t('status-pipeline.void')}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-64 text-center">
            {ddt('eval-status-desc.anulada' as any)}
          </TooltipContent>
        </Tooltip>
        </div>{/* end overflow-x-auto */}
      </div>{/* end relative wrapper */}

      <ConfirmDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
        title={
          pendingStatus
            ? t('status-pipeline.change-to', { status: dt(`eval-status.${pendingStatus}` as any) ?? pendingStatus })
            : t('status-pipeline.change-status')
        }
        description={
          pendingStatus
            ? t(`status-pipeline.confirm.${pendingStatus}` as any) ?? t('status-pipeline.confirm-change')
            : t('status-pipeline.confirm-change')
        }
        onConfirm={handleConfirm}
        confirmText={ct('confirm')}
        variant={pendingStatus === 'anulada' ? 'destructive' : 'default'}
      />
      </>
    </TooltipProvider>
  );
}
