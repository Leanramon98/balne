'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import useSWR from 'swr';
import { useTranslations, useLocale } from 'next-intl';
import {
  getDestinations,
  getEvaluations,
  createEvaluation,
  updateEvaluation,
  getEvaluation,
} from '@/sdk/api/evaluations-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, MapPin, AlertCircle } from 'lucide-react';
import { formatDate, toDateInputValue } from '@/lib/date-utils';
import type { Evaluation, EvaluationType, EvaluationStatus, Destination } from '@/types';
import { TipoEvalCard } from '@/components/molecules/TipoEvalCard';
import { useDestino } from '@/context/destino-context';

interface EvalFormProps {
  mode: 'create' | 'edit';
  evaluationId?: string;
  initialData?: Partial<Evaluation>;
  onSuccess?: (id: string) => void;
}

const EVAL_TYPES: { value: EvaluationType }[] = [
  { value: 'autodiagnostico' },
  { value: 'diagnostico' },
  { value: 'auditoria' },
  { value: 'medicion_espontanea' },
];

const TIPO_CARD_META: Record<EvaluationType, { descriptionKey: string; badgeKey?: string }> = {
  autodiagnostico: { descriptionKey: 'form.type-card.autodiagnostico.description' },
  diagnostico: { descriptionKey: 'form.type-card.diagnostico.description', badgeKey: 'form.type-card.diagnostico.badge' },
  auditoria: { descriptionKey: 'form.type-card.auditoria.description', badgeKey: 'form.type-card.auditoria.badge' },
  medicion_espontanea: { descriptionKey: 'form.type-card.medicion_espontanea.description' },
};

const IN_PROGRESS_STATUSES: EvaluationStatus[] = ['en_curso', 'carga_finalizada', 'en_evaluacion'];

type CycleStatus = 'done' | 'pending' | 'in_progress';

function deriveCycleState(evals: Evaluation[], tipo: EvaluationType): CycleStatus {
  const match = evals.find((e) => e.type === tipo);
  if (!match) return 'pending';
  if (match.status === 'cerrada') return 'done';
  if (IN_PROGRESS_STATUSES.includes(match.status)) return 'in_progress';
  return 'pending';
}

export function EvalForm({ mode, evaluationId, initialData, onSuccess }: EvalFormProps) {
  const { data: destinations } = useSWR('destinations', () => getDestinations());
  const { activeDestino, setActiveDestino, canSelectDestino } = useDestino();
  const t = useTranslations('evaluation');
  const dt = useTranslations('display-names');
  const ct = useTranslations('common');
  const locale = useLocale();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<EvaluationType>('autodiagnostico');
  const [destinationId, setDestinationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hasExternalEvaluator, setHasExternalEvaluator] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Origin evaluation name (for promotions)
  const [originEvalName, setOriginEvalName] = useState<string | null>(null);

  // Available types based on promotion context
  const [availableTypes, setAvailableTypes] = useState<typeof EVAL_TYPES>(EVAL_TYPES);

  // Cycle state for the destination (create mode only)
  const [cycleStates, setCycleStates] = useState<{
    autodiagnostico: CycleStatus;
    diagnostico: CycleStatus;
    auditoria: CycleStatus;
  } | undefined>(undefined);

  // Sync destinationId when activeDestino changes
  useEffect(() => {
    if (activeDestino) setDestinationId(activeDestino.id);
  }, [activeDestino]);

  // Fetch cycle state for the destination (create mode only)
  useEffect(() => {
    if (mode !== 'create' || !destinationId) {
      setCycleStates(undefined);
      return;
    }

    getEvaluations({ destination_id: destinationId })
      .then(({ data: evals }) => {
        setCycleStates({
          autodiagnostico: deriveCycleState(evals, 'autodiagnostico'),
          diagnostico: deriveCycleState(evals, 'diagnostico'),
          auditoria: deriveCycleState(evals, 'auditoria'),
        });
      })
      .catch(() => {
        setCycleStates(undefined);
      });
  }, [mode, destinationId]);

  // Load initial data
  useEffect(() => {
    if (!initialData) return;

    if (initialData.name) setName(initialData.name);
    if (initialData.destination_id) setDestinationId(initialData.destination_id);
    if (initialData.type) setType(initialData.type);
    if (initialData.start_date) setStartDate(toDateInputValue(initialData.start_date));
    if (initialData.end_date) setEndDate(toDateInputValue(initialData.end_date));
    if (initialData.has_external_evaluator) setHasExternalEvaluator(initialData.has_external_evaluator);
    setAuditCreatedBy(initialData.created_by_name?.trim() || '');
    setAuditCreatedAt(initialData.created_at || '');
    setAuditUpdatedAt(initialData.updated_at || '');

    // Handle promotion restrictions
    if (initialData.promoted_from_id) {
      const originId = initialData.promoted_from_id;
      // Try to get origin eval name and type to restrict available types
      getEvaluation(originId)
        .then((originEval) => {
          setOriginEvalName(originEval.name);
          // Restrict types based on origin type (HU-04)
          const restricted = getPromotionRestrictedTypes(originEval.type);
          setAvailableTypes(restricted);
        })
        .catch(() => {
          // If we can't fetch the origin, just show all types
          setOriginEvalName('(ID: ' + originId.slice(0, 8) + ')');
        });
    }
  }, [initialData]);

  // Reset selected type if it becomes unavailable due to cycle restrictions
  useEffect(() => {
    if (mode !== 'create' || !cycleStates) return;
    if (type === 'diagnostico' && cycleStates.autodiagnostico !== 'done') {
      setType('autodiagnostico');
    }
    if (type === 'auditoria' && cycleStates.diagnostico !== 'done') {
      setType('autodiagnostico');
    }
  }, [mode, cycleStates, type]);

  // Audit data (edit mode)
  const [auditCreatedBy, setAuditCreatedBy] = useState<string>('');
  const [auditCreatedAt, setAuditCreatedAt] = useState<string>('');
  const [auditUpdatedAt, setAuditUpdatedAt] = useState<string>('');

  // Also load evaluation data in edit mode if no initialData provided
  useEffect(() => {
    if (mode === 'edit' && evaluationId && !initialData) {
      getEvaluation(evaluationId)
        .then((data) => {
          setName(data.name || '');
          setType(data.type);
          setDestinationId(data.destination_id);
          setStartDate(toDateInputValue(data.start_date));
          setEndDate(toDateInputValue(data.end_date));
          setHasExternalEvaluator(data.has_external_evaluator);
          // Audit data
          setAuditCreatedBy(data.created_by_name?.trim() || '');
          setAuditCreatedAt(data.created_at || '');
          setAuditUpdatedAt(data.updated_at || '');
        })
        .catch((err: unknown) => {
          setFormError(getErrorMessage(err, t('form.load-error')));
        });
    }
  }, [mode, evaluationId, initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!name.trim()) {
      setFormError(t('form.validation.name-required'));
      return;
    }

    if (mode === 'create' && !destinationId) {
      setFormError(t('form.validation.destination-required'));
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setFormError(t('form.validation.end-date-after-start'));
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        const result = await createEvaluation({
          destination_id: destinationId,
          name: name.trim(),
          type,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          has_external_evaluator: type === 'medicion_espontanea' ? hasExternalEvaluator : undefined,
        });
        toast.success(t('form.create-success'));
        if (onSuccess) {
          onSuccess(result.id);
        }
      } else {
        if (!evaluationId) throw new Error('Evaluation ID is required for edit mode');
        await updateEvaluation(evaluationId, {
          name: name.trim(),
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          has_external_evaluator: hasExternalEvaluator,
        });
        toast.success(t('form.update-success'));
        if (onSuccess) {
          onSuccess(evaluationId);
        }
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, t('form.save-error'));
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error summary banner */}
      {formError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">{t('form.error-summary')}</p>
            <ul className="mt-1 list-disc list-inside text-sm text-red-600 space-y-0.5">
              <li>{formError}</li>
            </ul>
          </div>
        </div>
      )}

      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="name">{t('form.name')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('form.name-placeholder')}
        />
      </div>

      {/* Destino (only in create mode) */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="destination">{t('form.destination')}</Label>
          {activeDestino ? (
            <div className="border border-zinc-200 rounded-[10px] px-4 py-3 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-zinc-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-zinc-800">{activeDestino.name}</span>
              </div>
              {canSelectDestino && (
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => {
                    setActiveDestino(null);
                    setDestinationId('');
                  }}
                >
                  {t('form.change')}
                </button>
              )}
            </div>
          ) : canSelectDestino ? (
            <Select value={destinationId} onValueChange={setDestinationId}>
              <SelectTrigger id="destination">
                <SelectValue placeholder={t('form.select-destination')} />
              </SelectTrigger>
              <SelectContent>
                {destinations?.map((d: Destination) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      )}

      {/* Tipo */}
      <div className="space-y-2">
        <Label>{t('form.type')} {mode === 'edit' ? '' : '*'}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {EVAL_TYPES.map((tv) => {
            const meta = TIPO_CARD_META[tv.value];
            const isPromotionRestricted = mode === 'create' && !availableTypes.find((at) => at.value === tv.value);
            const isCycleRestricted = mode === 'create' && (
              (tv.value === 'diagnostico' && (!cycleStates || cycleStates.autodiagnostico !== 'done')) ||
              (tv.value === 'auditoria' && (!cycleStates || cycleStates.diagnostico !== 'done'))
            );
            const isDisabled = mode === 'edit' || isPromotionRestricted || isCycleRestricted;

            let disabledReason: string | undefined;
            if (mode === 'edit' && type === tv.value) {
              disabledReason = t('form.disabled.type-not-editable');
            } else if (isCycleRestricted) {
              if (tv.value === 'diagnostico') {
                disabledReason = t('form.disabled.requires-autodiagnostico');
              } else if (tv.value === 'auditoria') {
                disabledReason = t('form.disabled.requires-diagnostico');
              }
            } else if (isPromotionRestricted) {
              disabledReason = t('form.disabled.not-available-promotion');
            }

            return (
              <TipoEvalCard
                key={tv.value}
                tipo={{ id: tv.value, label: dt(`eval-type.${tv.value}` as any), description: t(meta.descriptionKey), badge: meta.badgeKey ? t(meta.badgeKey) : undefined }}
                selected={type === tv.value}
                disabled={isDisabled}
                disabledReason={disabledReason}
                onClick={() => {
                  if (isDisabled) return;
                  setType(tv.value);
                  if (tv.value !== 'medicion_espontanea') {
                    setHasExternalEvaluator(false);
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Evaluación origen (readonly when promoted) */}
      {originEvalName && (
        <div className="space-y-2">
          <Label>{t('form.origin-evaluation')}</Label>
          <Input value={originEvalName} disabled />
        </div>
      )}

      {/* Tiene evaluador externo */}
      {type === 'medicion_espontanea' && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="externalEvaluator"
            checked={hasExternalEvaluator}
            onCheckedChange={(v) => setHasExternalEvaluator(!!v)}
          />
          <Label htmlFor="externalEvaluator">{t('form.external-evaluator')}</Label>
        </div>
      )}

      {/* Audit data section (edit mode, read-only) */}
      {mode === 'edit' && (auditCreatedBy || auditCreatedAt) && (
        <div className="bg-gray-50 border rounded-md p-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">{t('form.audit-data')}</h4>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">{t('form.created-by')}</span>{' '}
              {auditCreatedBy || '-'}
            </div>
            <div>
              <span className="font-medium">{t('form.created-at')}</span>{' '}
              {auditCreatedAt ? formatDate(auditCreatedAt, locale) : '-'}
            </div>
            <div>
              <span className="font-medium">{t('form.updated-at')}</span>{' '}
              {auditUpdatedAt ? formatDate(auditUpdatedAt, locale) : '-'}
            </div>
          </div>
        </div>
      )}

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t('form.start-date')}</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t('form.end-date')}</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Form error (inline, now redundant with banner but kept for any additional rendering) */}

      {/* Footer */}
      <div className="-mx-6 -mb-6 mt-6 bg-zinc-50 border-t border-zinc-200 rounded-b-[14px] px-6 py-4 flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          {ct('cancel')}
        </Button>
        <Button type="submit" variant="black" disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving
            ? ct('saving')
            : mode === 'create'
              ? t('form.create')
              : t('form.save-changes')}
        </Button>
      </div>
    </form>
  );
}

/**
 * Restrict available evaluation types based on promotion context (HU-04).
 *
 * Rules:
 * - Autodiagnóstico always available
 * - Medición Espontánea always available
 * - Diagnóstico only available if promoting from Autodiagnóstico
 * - Auditoría only available if promoting from Diagnóstico
 */
function getPromotionRestrictedTypes(originType: EvaluationType): typeof EVAL_TYPES {
  // Always available
  const alwaysAvailable: EvaluationType[] = ['autodiagnostico', 'medicion_espontanea'];

  const extraTypes: EvaluationType[] =
    originType === 'autodiagnostico'
      ? ['diagnostico']
      : originType === 'diagnostico'
        ? ['auditoria']
        : [];

  const allowed = new Set([...alwaysAvailable, ...extraTypes]);

  return EVAL_TYPES.filter((t) => allowed.has(t.value));
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
