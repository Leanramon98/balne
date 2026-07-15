'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import {
  getAdminIndicators,
  createAdminIndicator,
  updateAdminIndicator,
  deleteAdminIndicator,
  getAdminRequirements,
} from '@/sdk/api/evaluations-api';
import { getIndicatorName } from '@/lib/indicator-translations';
import { getRequirementName } from '@/lib/requirement-translations';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, X, Trash2 } from 'lucide-react';
import { RequirementBadge } from '@/components/atoms/RequirementBadge';
import type { Indicator, IndicatorCriteria, IndicatorType } from '@/types';

const GRADIENT_LEVELS = [0, 25, 50, 75, 100] as const;

const CRITERIO_DESCRIPTIONS = [
  { level: '0%', description: 'No cumple con el requisito' },
  { level: '25%', description: 'Cumplimiento inicial' },
  { level: '50%', description: 'Cumplimiento parcial' },
  { level: '75%', description: 'Cumplimiento avanzado' },
  { level: '100%', description: 'Cumplimiento total' },
];

const DEFAULT_BOOLEAN_CRITERIA: IndicatorCriteria[] = [
  { level: 0, value: 0, description: 'No cumple' },
  { level: 1, value: 1, description: 'Sí cumple' },
];

const DEFAULT_SUMA_ZERO_CRITERIA: IndicatorCriteria = { level: 0, value: 0, description: 'No cumple / Ninguno' };

const DEFAULT_SUMA_CRITERIA: IndicatorCriteria[] = [DEFAULT_SUMA_ZERO_CRITERIA];

const createDefaultGradientCriteria = (): IndicatorCriteria[] =>
  GRADIENT_LEVELS.map((level) => ({
    level,
    value: level,
    description: CRITERIO_DESCRIPTIONS.find((c) => c.level === `${level}%`)?.description ?? '',
  }));

const createDefaultCriteria = (type: IndicatorType): IndicatorCriteria[] => {
  if (type === 'boolean') return DEFAULT_BOOLEAN_CRITERIA;
  if (type === 'suma') return DEFAULT_SUMA_CRITERIA;
  return createDefaultGradientCriteria();
};

const normalizeCriteriaForType = (
  type: IndicatorType,
  existingCriteria?: IndicatorCriteria[],
): IndicatorCriteria[] => {
  if (!existingCriteria || existingCriteria.length === 0) {
    return createDefaultCriteria(type);
  }

  if (type === 'gradient') {
    return GRADIENT_LEVELS.map((level) => {
      const current = existingCriteria.find((criteria) => criteria.level === level || criteria.value === level);
      return {
        level,
        value: level,
        description: current?.description ?? '',
      };
    });
  }

  if (type === 'boolean') {
    return DEFAULT_BOOLEAN_CRITERIA.map((criteria) => {
      const current = existingCriteria.find((item) => item.level === criteria.level || item.value === criteria.value);
      return {
        ...criteria,
        description: current?.description ?? criteria.description,
      };
    });
  }

  if (type === 'suma') {
    const normalized = existingCriteria.map((criteria) => ({
      level: criteria.value ?? criteria.level ?? 0,
      value: criteria.value ?? criteria.level ?? 0,
      description: criteria.description ?? '',
    }));
    const zeroCriteria = normalized.find((criteria) => criteria.value === 0);
    const positiveCriteria = normalized.filter((criteria) => criteria.value !== 0);

    return [zeroCriteria ?? DEFAULT_SUMA_ZERO_CRITERIA, ...positiveCriteria];
  }

  return existingCriteria;
};

const getCriteriaFromIndicator = (indicator: Indicator | null | undefined, type: IndicatorType): IndicatorCriteria[] => {
  if (!indicator) return createDefaultCriteria(type);

  const mappingRules = indicator.mapping_rules ?? [];
  const tags = indicator.tags ?? [];

  if (indicator.criteria?.length > 0) {
    return normalizeCriteriaForType(type, indicator.criteria);
  }

  if (mappingRules.length > 0) {
    return normalizeCriteriaForType(
      type,
      mappingRules.map((rule) => {
        const value = Number(rule.valor);

        return {
          level: Number.isNaN(value) ? 0 : value,
          value: Number.isNaN(value) ? 0 : value,
          description: rule.tipo,
        };
      }),
    );
  }

  if (tags.length > 0) {
    if (type === 'gradient') {
      return normalizeCriteriaForType(
        type,
        GRADIENT_LEVELS.map((level, index) => ({
          level,
          value: level,
          description: tags[index] ?? '',
        })),
      );
    }

    if (type === 'boolean') {
      return normalizeCriteriaForType(
        type,
        DEFAULT_BOOLEAN_CRITERIA.map((criteria, index) => ({
          ...criteria,
          description: tags[index] ?? criteria.description,
        })),
      );
    }

    if (type === 'suma') {
      return [
        DEFAULT_SUMA_ZERO_CRITERIA,
        ...tags.map((tag) => ({
          level: 0,
          value: 0,
          description: tag,
        })),
      ];
    }
  }

  return createDefaultCriteria(type);
};

const getPositiveSumaTotal = (criteria: IndicatorCriteria[]) =>
  criteria
    .filter((item) => (item.value ?? 0) > 0)
    .reduce((sum, item) => sum + (item.value ?? 0), 0);

const hasInvalidSumaCriteria = (criteria: IndicatorCriteria[]) =>
  criteria.some((item, index) => {
    const value = item.value ?? 0;
    if (index === 0) return value !== 0;
    return value <= 0 || value > 100;
  });

export default function IndicatorsTab() {
  const { data: indicators, isLoading, mutate } = useSWR('admin-indicators', () => getAdminIndicators());
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [deleteIndicator, setDeleteIndicator] = useState<any>(null);
  const [editIndicator, setEditIndicator] = useState<Indicator | null>(null);

  const handleDelete = async () => {
    if (!deleteIndicator) return;
    try {
      await deleteAdminIndicator(deleteIndicator.id);
      mutate();
    } catch { alert('Error al eliminar'); }
    setDeleteIndicator(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Indicadores</CardTitle>
          <Button size="sm" onClick={() => { setStep(1); setResetKey(k => k + 1); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Nuevo Indicador
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Código</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Nombre</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Descripción</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Tipo</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Requisito</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {indicators?.map((ind) => (
              <TableRow key={ind.id}>
                <TableCell className="font-mono">{ind.code}</TableCell>
                <TableCell className="max-w-xs truncate">{getIndicatorName(ind.code, locale, ind.name)}</TableCell>
                <TableCell className="max-w-xs truncate text-zinc-600">{ind.indicator_description || <span className="text-zinc-300">—</span>}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{ind.type}</Badge>
                </TableCell>
                <TableCell><RequirementBadge requirement_id={ind.requirement_id} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteIndicator(ind)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditIndicator(ind); setStep(1); setResetKey(k => k + 1); setDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setEditIndicator(null); } setDialogOpen(o); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editIndicator ? 'Editar Indicador' : `Nuevo Indicador — Paso ${step} de 2`}</DialogTitle></DialogHeader>
          <IndicatorWizardStep
            key={resetKey}
            step={step}
            editIndicator={editIndicator}
            onNext={() => setStep(s => s + 1)}
            onPrev={() => setStep(s => s - 1)}
            onSaved={() => { setEditIndicator(null); setDialogOpen(false); mutate(); }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteIndicator}
        onOpenChange={(o) => { if (!o) setDeleteIndicator(null); }}
        title="¿Eliminar indicador?"
        description={`Esta acción eliminará "${deleteIndicator?.code} — ${getIndicatorName(deleteIndicator?.code, locale, deleteIndicator?.name ?? '')}" de forma permanente.`}
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
      />
    </Card>
  );
}

function IndicatorWizardStep({
  step,
  editIndicator,
  onNext,
  onPrev,
  onSaved,
}: {
  step: number;
  editIndicator?: Indicator | null;
  onNext: () => void;
  onPrev: () => void;
  onSaved: () => void;
}) {
  const locale = useLocale();
  // ── Step 1: Datos básicos ──────────────────────────────────
  const [requirementId, setRequirementId] = useState(editIndicator?.requirement_id || '');
  const [nivel, setNivel] = useState(editIndicator?.nivel || '');
  const [tipologia, setTipologia] = useState(editIndicator?.tipologia || '');
  const [clasificacion, setClasificacion] = useState(editIndicator?.clasificacion || '');
  const [code, setCode] = useState(editIndicator?.code || '');
  const [name, setName] = useState(editIndicator?.name || '');
  const [requirementDescription, setRequirementDescription] = useState(editIndicator?.requirement_description || '');
  const [indicatorDescription, setIndicatorDescription] = useState(editIndicator?.indicator_description || '');

  // ── Step 2: Tipo y criterios ───────────────────────────────
  const isEditingNumeric = editIndicator?.type === 'numeric';
  const initialType = isEditingNumeric ? 'gradient' : ((editIndicator?.type as IndicatorType) || 'gradient');
  const [type, setType] = useState<IndicatorType>(initialType);
  const [criteria, setCriteria] = useState<IndicatorCriteria[]>(() => getCriteriaFromIndicator(editIndicator, initialType));

  const [saving, setSaving] = useState(false);

  const { data: requirements } = useSWR('admin-requirements-wizard', () => getAdminRequirements());

  const handleTypeChange = (nextType: IndicatorType) => {
    setType(nextType);
    setCriteria(nextType === editIndicator?.type ? getCriteriaFromIndicator(editIndicator, nextType) : createDefaultCriteria(nextType));
  };

  const updateCriteriaDescription = (index: number, description: string) => {
    setCriteria((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, description } : item
    )));
  };

  const updateSumaCriteria = (index: number, field: 'description' | 'value', value: string) => {
    setCriteria((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (field === 'description') return { ...item, description: value };

      const numericValue = Number(value);
      return {
        ...item,
        level: Number.isNaN(numericValue) ? 0 : numericValue,
        value: Number.isNaN(numericValue) ? 0 : numericValue,
      };
    }));
  };

  const addSumaCriteria = () => {
    setCriteria((current) => [...current, { level: 0, value: 0, description: '' }]);
  };

  const removeSumaCriteria = (index: number) => {
    setCriteria((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!code.trim() || !name.trim() || !requirementId) {
      alert('Requisito asociado, Código y Nombre son obligatorios');
      return;
    }
    if (type === 'suma' && (hasInvalidSumaCriteria(criteria) || getPositiveSumaTotal(criteria) !== 100)) {
      alert('Los criterios positivos de suma deben ser mayores a 0, menores o iguales a 100, y totalizar 100%');
      return;
    }
    setSaving(true);
    try {
      const payloadType = isEditingNumeric ? 'numeric' : type;
      const normalizedCriteria = isEditingNumeric ? (editIndicator?.criteria ?? []) : normalizeCriteriaForType(type, criteria);
      const tags = isEditingNumeric
        ? (editIndicator?.tags ?? [])
        : normalizedCriteria.map((item) => item.description || `${item.value ?? item.level ?? 0}${type === 'suma' || type === 'gradient' ? '%' : ''}`);
      const mappingRules = isEditingNumeric
        ? editIndicator?.mapping_rules
        : type === 'suma'
        ? normalizedCriteria.map((item) => ({
            tipo: item.description || '',
            valor: String(item.value ?? item.level ?? 0),
          }))
        : undefined;

      const payload = {
        code: code.trim(),
        name: name.trim(),
        type: payloadType,
        requirement_id: requirementId,
        nivel: nivel || undefined,
        tipologia: tipologia || undefined,
        clasificacion: clasificacion.trim() || undefined,
        requirement_description: requirementDescription.trim() || undefined,
        indicator_description: indicatorDescription.trim() || undefined,
        criteria: normalizedCriteria,
        tags,
        mapping_rules: mappingRules,
      };

      if (editIndicator) {
        await updateAdminIndicator(editIndicator.id, payload);
      } else {
        await createAdminIndicator(payload);
      }
      onSaved();
    } catch (err) {
      alert('Error al guardar indicador: ' + (err instanceof Error ? err.message : 'desconocido'));
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  STEP 1 — Datos básicos
  // ═══════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <div className="space-y-5 py-4">
        {/* Variable / Requisito asociado */}
        <div className="space-y-2">
          <Label>Variable / Requisito asociado *</Label>
          <Select value={requirementId} onValueChange={setRequirementId}>
            <SelectTrigger><SelectValue placeholder="Seleccionar requisito" /></SelectTrigger>
            <SelectContent>
              {requirements?.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.code} — {getRequirementName(r.code, locale, r.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nivel */}
        <div className="space-y-2">
          <Label>Nivel</Label>
          <Select value={nivel} onValueChange={setNivel}>
            <SelectTrigger><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Alto">Alto</SelectItem>
              <SelectItem value="Medio">Medio</SelectItem>
              <SelectItem value="Bajo">Bajo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipología */}
        <div className="space-y-2">
          <Label>Tipología</Label>
          <Select value={tipologia} onValueChange={setTipologia}>
            <SelectTrigger><SelectValue placeholder="Seleccionar tipología" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="obligatorio">Obligatorio</SelectItem>
              <SelectItem value="opcional">Opcional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clasificación */}
        <div className="space-y-2">
          <Label>Clasificación</Label>
          <Input
            value={clasificacion}
            onChange={e => setClasificacion(e.target.value)}
            placeholder="Ej: Cuantitativo, Cualitativo, Gestión…"
          />
        </div>

        {/* Código */}
        <div className="space-y-2">
          <Label>Código *</Label>
          <Input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Ej: ACC_A_01_01"
          />
        </div>

        {/* Nombre */}
        <div className="space-y-2">
          <Label>Nombre *</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del indicador"
          />
        </div>

        {/* Descripción del requisito */}
        <div className="space-y-2">
          <Label>Descripción del requisito</Label>
          <Textarea
            value={requirementDescription}
            onChange={e => setRequirementDescription(e.target.value)}
            placeholder="Descripción del requisito asociado"
            rows={2}
          />
        </div>

        {/* Descripción del indicador */}
        <div className="space-y-2">
          <Label>Descripción del indicador</Label>
          <Textarea
            value={indicatorDescription}
            onChange={e => setIndicatorDescription(e.target.value)}
            placeholder="¿Qué se mide?"
            rows={2}
          />
        </div>

        <Button onClick={onNext} className="w-full">
          Siguiente — Criterios
        </Button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  STEP 2 — Tipo y criterios de evaluación
  // ═══════════════════════════════════════════════════════════
  if (step === 2) {
    const sumaTotal = getPositiveSumaTotal(criteria);
    const isInvalidSuma = type === 'suma' && (hasInvalidSumaCriteria(criteria) || sumaTotal !== 100);

    return (
      <div className="space-y-5 py-4">
        {/* Tipo de indicador */}
        {isEditingNumeric ? (
          <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            Este indicador es numérico. Por ahora no tiene criterios configurables y se conservará como numérico al guardar.
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Tipo de indicador</Label>
            <Select value={type} onValueChange={v => handleTypeChange(v as IndicatorType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gradient">Gradiente (0/25/50/75/100)</SelectItem>
                <SelectItem value="boolean">Sí / No</SelectItem>
                <SelectItem value="suma">Suma (porcentajes acumulativos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Separator />

        {/* Criterios */}
        {!isEditingNumeric && <div className="space-y-3">
          <div>
            <Label>Criterios de evaluación</Label>
            <p className="text-sm text-muted-foreground">
              Definí los criterios que verá el indicador según su tipo.
            </p>
          </div>

          {type === 'suma' ? (
            <div className="space-y-3">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Descripción</TableHead>
                      <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-[120px]">%</TableHead>
                      <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-[80px]">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criteria.map((item, index) => {
                      const isRequiredZero = (item.value ?? 0) === 0 && index === 0;

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.description ?? ''}
                              onChange={e => updateSumaCriteria(index, 'description', e.target.value)}
                              placeholder={isRequiredZero ? 'No cumple / Ninguno' : 'Ej: Cumple parcialmente'}
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={item.value ?? 0}
                              onChange={e => updateSumaCriteria(index, 'value', e.target.value)}
                              disabled={isRequiredZero}
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            {!isRequiredZero && (
                              <Button variant="ghost" size="icon" onClick={() => removeSumaCriteria(index)}>
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="outline" size="sm" onClick={addSumaCriteria}>
                  <Plus className="mr-1 h-3 w-3" /> Agregar criterio
                </Button>
                <span className={sumaTotal === 100 ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
                  Total positivo: {sumaTotal}%
                </span>
              </div>
              {hasInvalidSumaCriteria(criteria) && (
                <p className="text-sm text-destructive">
                  El criterio 0% es obligatorio y los criterios adicionales deben ser mayores a 0 y menores o iguales a 100.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-[140px]">Valor</TableHead>
                    <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criteria.map((item, index) => (
                    <TableRow key={item.level ?? item.value ?? index}>
                      <TableCell className="font-mono text-xs">
                        {type === 'gradient' ? `${item.value ?? item.level}%` : item.value === 1 ? 'Sí' : 'No'}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description ?? ''}
                          onChange={e => updateCriteriaDescription(index, e.target.value)}
                          placeholder="Descripción del criterio"
                          className="h-8 text-xs"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>}

        <div className="flex gap-3 justify-between pt-2">
          <Button variant="outline" onClick={onPrev}>Anterior</Button>
          <Button onClick={handleSave} disabled={saving || isInvalidSuma}>
            {saving ? 'Guardando…' : 'Guardar Indicador'}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
