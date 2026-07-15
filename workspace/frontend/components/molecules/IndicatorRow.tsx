'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Pencil, Eye, Trash2 } from 'lucide-react';
import { getUserRoles } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { getIndicatorName } from '@/lib/indicator-translations';
import type { IndicatorType } from '@/types';

export interface IndicatorRequirementData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

/**
 * Flattened indicator row data — returned by getScopeIndicators API
 * which merges Indicator + IndicatorValue fields into a single object.
 */
export interface IndicatorRowData {
  id: string;
  requirement_id: string;
  requirement?: IndicatorRequirementData;
  code: string;
  name: string;
  type: IndicatorType;
  description?: string;
  axis_name?: string;
  is_completed?: boolean;
  has_evidence?: boolean;
  destination_value?: number;
  evaluator_value?: number;
  is_verified?: boolean;
}

function formatIndicatorValue(value?: number) {
  return value ?? '—';
}

type IndicatorStatus = 'pendiente' | 'parcial' | 'completado';

function getIndicatorStatus(indicator: IndicatorRowData): IndicatorStatus {
  if (!indicator.is_completed) return 'pendiente';
  if (indicator.has_evidence) return 'completado';
  return 'parcial';
}

const STATUS_STYLE: Record<IndicatorStatus, { variant: 'success' | 'warning' | 'outline'; className: string }> = {
  completado: { variant: 'success', className: '' },
  parcial:    { variant: 'warning', className: '' },
  pendiente:  { variant: 'outline', className: 'border-zinc-200 bg-zinc-100 text-zinc-600' },
};

interface IndicatorRowProps {
  indicator: IndicatorRowData;
  evaluationId: string;
  scopeId: string;
  onDelete: (id: string) => void;
  showActions?: boolean;
}

const ADMIN_ROLES = ['admin', 'admin_destino'];

export function IndicatorRow({
  indicator,
  evaluationId,
  scopeId,
  onDelete,
  showActions = true,
}: IndicatorRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const userRoles = getUserRoles();
  const canDelete = ADMIN_ROLES.some((r) => userRoles.includes(r));
  const hasValue = indicator.destination_value !== undefined || indicator.evaluator_value !== undefined;
  const destinationValue = formatIndicatorValue(indicator.destination_value);
  const evaluatorValue = formatIndicatorValue(indicator.evaluator_value);
  const status = getIndicatorStatus(indicator);
  const t = useTranslations('evaluation');
  const locale = useLocale();

  const statusLabels: Record<IndicatorStatus, string> = {
    completado: t('indicators.row.complete'),
    parcial:    t('indicators.row.partial'),
    pendiente:  t('indicators.row.pending'),
  };

  const statusTips: Record<IndicatorStatus, string> = {
    completado: t('indicators.row.status-complete-tip'),
    parcial:    t('indicators.row.status-partial-tip'),
    pendiente:  t('indicators.row.status-pending-tip'),
  };

  return (
    <>
      <motion.tr
        className="bg-white hover:bg-zinc-50 border-b transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <TableCell className="py-3 pl-12">
          <Link
            href={`/evaluaciones/${evaluationId}/ambitos/${scopeId}/${indicator.id}/editar`}
            className="font-medium text-zinc-900 hover:text-blue-600 hover:underline transition-colors"
          >
            {getIndicatorName(indicator.code, locale, indicator.name)}
          </Link>
          <span className="ml-2 font-mono text-xs text-zinc-500">{indicator.code}</span>
        </TableCell>
        <TableCell>
          <Badge
            variant={STATUS_STYLE[status].variant}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              STATUS_STYLE[status].className,
            )}
            title={statusTips[status]}
          >
            {statusLabels[status]}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-zinc-700">
          {hasValue ? (
            <span
              className="inline-flex items-center gap-2 whitespace-nowrap"
              aria-label={`Valor destino: ${destinationValue}. Valor evaluador: ${evaluatorValue}.`}
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-blue-500" aria-hidden="true">•</span>
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Destino</span>
                <span>{destinationValue}</span>
              </span>
              <span className="text-zinc-400" aria-hidden="true">›</span>
              <span className="inline-flex items-center gap-1">
                <span className="text-amber-500" aria-hidden="true">•</span>
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Evaluador</span>
                <span>{evaluatorValue}</span>
              </span>
            </span>
          ) : (
            <span className="text-zinc-400">{t('indicators.row.not-loaded')}</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            {showActions && (
              <Button variant="ghost" size="icon" asChild>
                <Link
                  href={`/evaluaciones/${evaluationId}/ambitos/${scopeId}/${indicator.id}/editar`}
                      title={t('indicators.row.edit')}
                >
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" asChild>
              <Link
                href={`/evaluaciones/${evaluationId}/ambitos/${scopeId}/${indicator.id}`}
                title={t('indicators.row.view')}
              >
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            {showActions && canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteOpen(true)}
                title={t('indicators.row.delete')}
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            )}
          </div>
        </TableCell>
      </motion.tr>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('indicators.row.delete-title')}
        description={t('indicators.row.delete-description', { code: indicator.code, name: getIndicatorName(indicator.code, locale, indicator.name) })}
        onConfirm={() => onDelete(indicator.id)}
        confirmText={t('indicators.row.delete')}
        variant="destructive"
      />
    </>
  );
}
