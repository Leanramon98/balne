'use client';

import { GradientSelect } from '@/components/atoms/GradientSelect';
import { BooleanSelect } from '@/components/atoms/BooleanSelect';
import { SumaSelect } from '@/components/atoms/SumaSelect';
import { ProgressWithLabel } from '@/components/atoms/ProgressWithLabel';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Save, Flag } from 'lucide-react';
import type { IndicatorCriteria } from '@/types';

interface DestinationValueCardProps {
  indicatorType: 'gradient' | 'boolean' | string;
  destValue: string;
  onDestValueChange: (value: string) => void;
  isDestination: boolean;
  meta: string;
  onMetaChange: (value: string) => void;
  metaDate: string;
  onMetaDateChange: (value: string) => void;
  metaNumeric: number;
  currentNumeric: number;
  destObs: string;
  onDestObsChange: (value: string) => void;
  saving: boolean;
  onSave: () => void;
  promotedValue?: string;
  isPromoted?: boolean;
  isGradient?: boolean;
  criteria?: IndicatorCriteria[];
  readOnlyContext?: boolean;
  disabled?: boolean;
  /** When true, renders only the inner content without the Card shell */
  noShell?: boolean;
}

/**
 * Destination value form card.
 * Contains value input (gradient/boolean/number), meta inputs,
 * progress bar, observations textarea, and save button.
 */
export function DestinationValueCard({
  indicatorType,
  destValue,
  onDestValueChange,
  isDestination,
  meta,
  onMetaChange,
  metaDate,
  onMetaDateChange,
  metaNumeric,
  currentNumeric,
  destObs,
  onDestObsChange,
  saving,
  onSave,
  promotedValue,
  isPromoted = false,
  isGradient: isGradientProp,
  criteria,
  readOnlyContext = false,
  disabled = false,
  noShell = false,
}: DestinationValueCardProps) {
  const isGradient = isGradientProp ?? (indicatorType === 'gradient');
  const isBoolean = indicatorType === 'boolean';
  const isSuma = indicatorType === 'suma';
  const isReadOnly = disabled || !isDestination || readOnlyContext;

  const content = (
    <CardContent className="space-y-5">
        {/* Current value */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-800">
              Valor actual
            </label>
            {isGradient ? (
              <GradientSelect
                value={destValue || ''}
                onChange={onDestValueChange}
                disabled={isReadOnly}
              />
            ) : isBoolean ? (
              <BooleanSelect
                value={destValue === '1' ? 'Sí' : destValue === '0' ? 'No' : ''}
                onChange={(v) => onDestValueChange(v === 'Sí' ? '1' : '0')}
                disabled={isReadOnly}
              />
            ) : isSuma ? (
              <SumaSelect
                value={destValue || ''}
                criteria={criteria ?? []}
                onChange={onDestValueChange}
                disabled={isReadOnly}
              />
            ) : (
              <Input
                type="number"
                value={destValue}
                onChange={(e) => onDestValueChange(e.target.value)}
                disabled={isReadOnly}
                placeholder="Valor numérico"
                className="w-full"
              />
            )}
            {readOnlyContext ? (
              <p className="mt-2 text-xs text-zinc-400">
                Este bloque es solo de consulta para el evaluador.
              </p>
            ) : !isDestination && !disabled && (
              <p className="mt-2 text-xs text-zinc-400">
                Solo el destino puede editar este valor.
              </p>
            )}
          </div>

          {/* Promoted value indicator */}
          {isPromoted && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                <Flag className="h-3.5 w-3.5" />
                Valor proveniente de evaluación anterior
              </p>
              <p className="mt-2 text-sm text-amber-700">
                {(promotedValue ?? destValue)
                  ? `${promotedValue ?? destValue}${isGradient ? '%' : ''}`
                  : 'Sin valor'}
              </p>
            </div>
          )}
        </div>

        {/* Meta + Meta date */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-800">
              Meta
            </label>
            {isGradient ? (
              <GradientSelect
                value={meta || ''}
                onChange={onMetaChange}
                disabled={isReadOnly}
              />
            ) : isBoolean ? (
              <BooleanSelect
                value={meta === '1' ? 'Sí' : meta === '0' ? 'No' : ''}
                onChange={(v) => onMetaChange(v === 'Sí' ? '1' : '0')}
                disabled={isReadOnly}
              />
            ) : isSuma ? (
              <SumaSelect
                value={meta || ''}
                criteria={criteria ?? []}
                onChange={onMetaChange}
                disabled={isReadOnly}
              />
            ) : (
              <Input
                type="number"
                value={meta}
                onChange={(e) => onMetaChange(e.target.value)}
                disabled={isReadOnly}
                placeholder="Valor meta"
              />
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-800">
              Fecha meta
            </label>
            <Input
              type="date"
              value={metaDate}
              onChange={(e) => onMetaDateChange(e.target.value)}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Progress bar */}
        {metaNumeric > 0 && (
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Progreso hacia la meta
            </p>
            <ProgressWithLabel
              value={currentNumeric}
              max={metaNumeric}
            />
          </div>
        )}

        {/* Observations */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-zinc-800">
            Observaciones
          </label>
          <Textarea
            value={destObs}
            onChange={(e) => onDestObsChange(e.target.value)}
            disabled={isReadOnly}
            placeholder="Observaciones..."
            rows={3}
          />
        </div>

        {/* Save destination button */}
        {!readOnlyContext && (isDestination || disabled) && (
          <Button onClick={onSave} disabled={disabled || saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Valor Destino'}
          </Button>
        )}
      </CardContent>
  );

  if (noShell) {
    return content;
  }

  return (
    <Card className="overflow-hidden border-blue-100 shadow-sm">
      <div className="h-1.5 bg-blue-600" />
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-zinc-950">
                {readOnlyContext ? 'Carga del destino — contexto' : 'Carga destino'}
              </CardTitle>
              <p className="mt-1 text-sm text-zinc-500">
                {readOnlyContext
                  ? 'Revisá el valor, la meta, la fecha y las observaciones cargadas por el destino.'
                  : 'Completá el valor actual, la meta y las observaciones del destino.'}
              </p>
            </div>
          </div>
          <Badge variant={destValue ? 'default' : 'secondary'} className={destValue ? 'bg-blue-600 hover:bg-blue-600' : ''}>
            {destValue ? `Valor ${destValue}${isGradient ? '%' : ''}` : 'Sin cargar'}
          </Badge>
        </div>
      </CardHeader>
      {content}
    </Card>
  );
}
