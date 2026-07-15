'use client';

import { GradientSelect } from '@/components/atoms/GradientSelect';
import { BooleanSelect } from '@/components/atoms/BooleanSelect';
import { SumaSelect } from '@/components/atoms/SumaSelect';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { VerificationBadge } from '@/components/molecules/VerificationBadge';
import { ClipboardCheck, Save } from 'lucide-react';
import type { IndicatorCriteria } from '@/types';

interface EvaluatorValueCardProps {
  indicatorType: 'gradient' | 'boolean' | string;
  evalValue: string;
  onEvalValueChange: (value: string) => void;
  evalObs: string;
  onEvalObsChange: (value: string) => void;
  isEditingEnabled: boolean;
  onEditingEnabledChange: (value: boolean) => void;
  isVerified: boolean;
  onVerifiedChange: (value: boolean) => void;
  saving: boolean;
  onSave: () => void;
  previousValue?: string | null;
  isGradient?: boolean;
  criteria?: IndicatorCriteria[];
  verifiedBy?: string;
  verifiedAt?: string;
  userName: string;
  disabled?: boolean;
  /** When true, renders only the inner content without the Card shell */
  noShell?: boolean;
}

/**
 * Evaluator value form card.
 * Contains value input (gradient/boolean/number), previous value display,
 * observations textarea, editing/verified checkboxes, verification badge,
 * and save button.
 */
export function EvaluatorValueCard({
  indicatorType,
  evalValue,
  onEvalValueChange,
  evalObs,
  onEvalObsChange,
  isEditingEnabled,
  onEditingEnabledChange,
  isVerified,
  onVerifiedChange,
  saving,
  onSave,
  previousValue,
  isGradient: isGradientProp,
  criteria,
  verifiedBy,
  verifiedAt,
  userName,
  disabled = false,
  noShell = false,
}: EvaluatorValueCardProps) {
  const isGradient = isGradientProp ?? (indicatorType === 'gradient');
  const isBoolean = indicatorType === 'boolean';
  const isSuma = indicatorType === 'suma';

  const content = (
    <CardContent className="space-y-4">
        {/* Current evaluator value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Valor actual
            </label>
            {isGradient ? (
              <GradientSelect
                value={evalValue || ''}
                onChange={onEvalValueChange}
                disabled={disabled}
              />
            ) : isBoolean ? (
              <BooleanSelect
                value={evalValue === '1' ? 'Sí' : evalValue === '0' ? 'No' : ''}
                onChange={(v) => onEvalValueChange(v === 'Sí' ? '1' : '0')}
                disabled={disabled}
              />
            ) : isSuma ? (
              <SumaSelect
                value={evalValue || ''}
                criteria={criteria ?? []}
                onChange={onEvalValueChange}
                disabled={disabled}
              />
            ) : (
              <Input
                type="number"
                value={evalValue}
                onChange={(e) => onEvalValueChange(e.target.value)}
                disabled={disabled}
                placeholder="Valor numérico"
              />
            )}
          </div>

          {/* Previous evaluation value */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Valor de evaluación anterior
            </label>
            <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {previousValue != null
                ? `${previousValue}${isGradient ? '%' : ''}`
                : 'Sin valor anterior'}
            </div>
          </div>
        </div>

        {/* Evaluator observations */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Observaciones del evaluador
          </label>
          <Textarea
            value={evalObs}
            onChange={(e) => onEvalObsChange(e.target.value)}
            disabled={disabled}
            placeholder="Observaciones..."
            rows={3}
          />
        </div>

        {/* Checkboxes row */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="editing-enabled"
              checked={isEditingEnabled}
              onCheckedChange={(checked) =>
                onEditingEnabledChange(checked === true)
              }
              disabled={disabled}
            />
            <label htmlFor="editing-enabled" className="text-sm cursor-pointer">
              Habilitar edición al destino
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="verified"
              checked={isVerified}
              onCheckedChange={(checked) => onVerifiedChange(checked === true)}
              disabled={disabled}
            />
            <label htmlFor="verified" className="text-sm cursor-pointer">
              Verificado
            </label>
          </div>
        </div>

        {/* Verification metadata */}
        {isVerified && (
          <VerificationBadge
            verifiedBy={verifiedBy}
            verifiedAt={verifiedAt}
            userName={userName}
          />
        )}

        {/* Save evaluator button */}
        <Button onClick={onSave} disabled={disabled || saving} className="bg-blue-600 hover:bg-blue-700">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar Valor Evaluador'}
        </Button>
      </CardContent>
  );

  if (noShell) {
    return content;
  }

  return (
    <Card className="overflow-hidden border-blue-100 shadow-sm">
      <div className="h-1.5 bg-blue-600" />
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-zinc-950">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          Carga evaluador
        </CardTitle>
      </CardHeader>
      {content}
    </Card>
  );
}
