'use client';

import { useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import useSWR from 'swr';
import {
  createAction,
  getActions,
  getEvaluation,
  getResponsibleAreas,
  getScopes,
  linkIndicatorToAction,
  uploadFile,
  addEvidence,
} from '@/sdk/api/evaluations-api';
import { ActionSelectorModal } from '@/components/organisms/ActionSelectorModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/atoms/EmptyState';
import { ScopeIcon } from '@/components/atoms/ScopeIcon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link2, Plus, Save, Upload, FileText, Loader2, Trash2, Link as LinkIcon, Video, Newspaper } from 'lucide-react';
import { LinkedActionRow } from '@/components/molecules/LinkedActionRow';
import { ACTION_STATUS_OPTIONS, getAxisOptions } from '@/lib/display-names';
import { getScopeName } from '@/lib/scope-translations';
import { toast } from 'sonner';
import type { Action, ActionStatus, Evaluation, IndicatorLink } from '@/types';

const COMPLEXITY_OPTIONS = ['Baja', 'Media', 'Alta'];
const HORIZON_OPTIONS = ['Corto plazo', 'Medio plazo', 'Largo plazo'];
const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'ARS'];

interface IndicatorActionsSectionProps {
  evaluationId: string;
  indicatorId: string;
  /** Optional — if not provided, fetches from the evaluation */
  destinationId?: string;
  readOnly?: boolean;
}

export function IndicatorActionsSection({
  evaluationId,
  indicatorId,
  destinationId: propDestinationId,
  readOnly = false,
}: IndicatorActionsSectionProps) {
  const locale = useLocale();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  // Form state
  const [newActionName, setNewActionName] = useState('');
  const [newActionSummary, setNewActionSummary] = useState('');
  const [newActionObjective, setNewActionObjective] = useState('');
  const [newActionStatus, setNewActionStatus] = useState<ActionStatus>('idea');
  const [selectedAxes, setSelectedAxes] = useState<string[]>([]);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [complexity, setComplexity] = useState('');
  const [horizon, setHorizon] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [responsibleArea, setResponsibleArea] = useState('');
  const [actors, setActors] = useState('');
  const [ods, setOds] = useState<{ ods_id: string; contribution: string }[]>([]);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('EUR');
  const [budgetExecuted, setBudgetExecuted] = useState('');
  const [budgetSource, setBudgetSource] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [awards, setAwards] = useState('');

  // Pending evidence state (uploaded before action creation)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingUrl, setPendingUrl] = useState('');
  const [pendingUrlType, setPendingUrlType] = useState<string>('url');
  const [pendingUrls, setPendingUrls] = useState<{ type: string; url: string }[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch evaluation to get destinationId if not provided
  const { data: evaluation } = useSWR(
    !propDestinationId && evaluationId ? ['eval-for-actions', evaluationId] : null,
    () => getEvaluation(evaluationId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  const destinationId = propDestinationId || (evaluation as Evaluation | undefined)?.destination_id || '';

  // Fetch all actions for the destination
  const {
    data: actions,
    isLoading,
    mutate,
  } = useSWR(
    destinationId ? ['actions', destinationId] : null,
    () => getActions(destinationId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  // Fetch scopes and areas for the create modal
  const { data: scopesList } = useSWR(
    createOpen ? 'scopes-accion-modal' : null,
    () => getScopes(),
  );
  const { data: areas } = useSWR(
    createOpen ? 'areas-accion-modal' : null,
    () => getResponsibleAreas(),
  );

  // Filter actions linked to this indicator + evaluation
  const linkedActions: Action[] = (actions || []).filter((action: Action) =>
    (action.linked_indicators || []).some(
      (link: IndicatorLink) =>
        link.indicator_id === indicatorId && link.evaluation_id === evaluationId,
    ),
  );

  const handleLinkSuccess = () => {
    setSelectorOpen(false);
    mutate();
  };

  const resetCreateForm = () => {
    setNewActionName('');
    setNewActionSummary('');
    setNewActionObjective('');
    setNewActionStatus('idea');
    setSelectedAxes([]);
    setSelectedScopes([]);
    setComplexity('');
    setHorizon('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setResponsiblePerson('');
    setResponsibleArea('');
    setActors('');
    setOds([]);
    setBudgetAmount('');
    setBudgetCurrency('EUR');
    setBudgetExecuted('');
    setBudgetSource('');
    setWebsiteUrl('');
    setPhotoUrl('');
    setAwards('');
    setPendingFiles([]);
    setPendingUrl('');
    setPendingUrls([]);
    setFormError('');
  };

  const handleCreateAction = async () => {
    if (!destinationId) {
      toast.error('No se pudo identificar el destino de la evaluación');
      return;
    }

    if (!newActionName.trim()) {
      setFormError('El nombre de la acción es obligatorio');
      return;
    }

    setCreating(true);
    setFormError('');
    try {
      const action = await createAction({
        destination_id: destinationId,
        name: newActionName.trim(),
        summary: newActionSummary.trim() || undefined,
        objective: newActionObjective.trim() || undefined,
        status: newActionStatus,
        axes: selectedAxes,
        scopes: selectedScopes,
        complexity: complexity || undefined,
        horizon: horizon || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        extended_description: description || undefined,
        responsible_person: responsiblePerson || undefined,
        responsible_area_id: responsibleArea || undefined,
        actors: actors || undefined,
        ods,
        budget_amount: budgetAmount ? Number(budgetAmount) : undefined,
        budget_currency: budgetCurrency,
        budget_executed: budgetExecuted ? Number(budgetExecuted) : undefined,
        budget_source: budgetSource || undefined,
        website_url: websiteUrl || undefined,
        photo_url: photoUrl || undefined,
        awards: awards || undefined,
      });

      await linkIndicatorToAction(action.id, indicatorId, evaluationId);

      // Upload pending evidences
      const hasEvidence = pendingFiles.length > 0 || pendingUrls.length > 0;
      if (hasEvidence) {
        setUploadingEvidence(true);
        try {
          // Upload files
          for (const file of pendingFiles) {
            await uploadFile(action.id, evaluationId, file);
          }
          // Add URLs
          for (const { type, url } of pendingUrls) {
            await addEvidence(action.id, evaluationId, type, url);
          }
        } catch (evErr) {
          console.error('Error uploading evidence:', evErr);
          // Don't block — action was created successfully
        } finally {
          setUploadingEvidence(false);
        }
      }

      await mutate();
      toast.success(hasEvidence ? 'Acción creada, vinculada y evidencias cargadas correctamente' : 'Acción creada y vinculada correctamente');
      setCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la acción';
      setFormError(message);
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4 text-gray-500" />
            Acciones vinculadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4 text-gray-500" />
          Acciones vinculadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {linkedActions.length === 0 ? (
          <EmptyState
            icon={<Link2 className="h-8 w-8" />}
            title="Sin acciones vinculadas"
            description="No hay acciones vinculadas a este indicador."
          />
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Nombre</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Estado</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Evidencias</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {linkedActions.map((action: Action) => (
                  <LinkedActionRow
                    key={action.id}
                    action={action}
                    evaluationId={evaluationId}
                    indicatorId={indicatorId}
                    onRefresh={mutate}
                  />
                ))}
            </TableBody>
          </Table>
          </div>
        )}

        {!readOnly && (
          <>
            <Separator />

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setSelectorOpen(true)}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Vincular acción existente
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  resetCreateForm();
                  setCreateOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar nueva acción
              </Button>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nueva acción</DialogTitle>
                  <DialogDescription>
                    Completá los datos de la acción. Se vinculará automáticamente a este indicador al guardarla.
                  </DialogDescription>
                </DialogHeader>

                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <Tabs defaultValue="basicos" className="mt-2">
                  <TabsList className="flex flex-wrap h-auto">
                    <TabsTrigger value="basicos">Datos Básicos</TabsTrigger>
                    <TabsTrigger value="clasificacion">Clasificación</TabsTrigger>
                    <TabsTrigger value="temporal">Temporal</TabsTrigger>
                    <TabsTrigger value="responsables">Responsables</TabsTrigger>
                    <TabsTrigger value="ods">ODS</TabsTrigger>
                    <TabsTrigger value="presupuesto">Presupuesto</TabsTrigger>
                    <TabsTrigger value="adicional">Adicional</TabsTrigger>
                    <TabsTrigger value="evidencias">Evidencias</TabsTrigger>
                  </TabsList>

                  {/* Datos Básicos */}
                  <TabsContent value="basicos" className="space-y-4">
                    <div className="pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="modal-action-name">Nombre *</Label>
                        <Input
                          id="modal-action-name"
                          value={newActionName}
                          onChange={(e) => setNewActionName(e.target.value)}
                          placeholder="Nombre de la acción"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modal-action-summary">Resumen</Label>
                        <Textarea
                          id="modal-action-summary"
                          value={newActionSummary}
                          onChange={(e) => setNewActionSummary(e.target.value)}
                          rows={2}
                          placeholder="Breve descripción de la acción"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modal-action-objective">Objetivo</Label>
                        <Textarea
                          id="modal-action-objective"
                          value={newActionObjective}
                          onChange={(e) => setNewActionObjective(e.target.value)}
                          rows={2}
                          placeholder="Objetivo esperado"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select
                          value={newActionStatus}
                          onValueChange={(v) => setNewActionStatus(v as ActionStatus)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTION_STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Clasificación */}
                  <TabsContent value="clasificacion" className="space-y-4">
                    <div className="pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Ejes</Label>
                        <div className="flex flex-wrap gap-2">
                          {getAxisOptions(locale).map((axis) => (
                            <Button
                              key={axis.value}
                              type="button"
                              variant={selectedAxes.includes(axis.value) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedAxes((prev) =>
                                  prev.includes(axis.value)
                                    ? prev.filter((a) => a !== axis.value)
                                    : [...prev, axis.value],
                                );
                              }}
                            >
                              {axis.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Ámbitos</Label>
                        <div className="flex flex-wrap gap-2">
                          {scopesList?.map((scope) => (
                            <Button
                              key={scope.id}
                              type="button"
                              variant={selectedScopes.includes(scope.id) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedScopes((prev) =>
                                  prev.includes(scope.id)
                                    ? prev.filter((s) => s !== scope.id)
                                    : [...prev, scope.id],
                                );
                              }}
                            >
                              <ScopeIcon icon={scope.icon} axis={scope.axis} acronym={scope.acronym} size="sm" />
                              <span>{getScopeName(scope.acronym, locale, scope.name)}</span>
                            </Button>
                          ))}
                          {(!scopesList || scopesList.length === 0) && (
                            <span className="text-sm text-gray-400">No hay ámbitos disponibles</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Complejidad</Label>
                        <Select value={complexity} onValueChange={setComplexity}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            {COMPLEXITY_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Horizonte</Label>
                        <Select value={horizon} onValueChange={setHorizon}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            {HORIZON_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Temporal */}
                  <TabsContent value="temporal" className="space-y-4">
                    <div className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fecha inicio</Label>
                          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha conclusión</Label>
                          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción implementación</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Responsables */}
                  <TabsContent value="responsables" className="space-y-4">
                    <div className="pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Persona responsable</Label>
                        <Input value={responsiblePerson} onChange={(e) => setResponsiblePerson(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Área responsable</Label>
                        <Select value={responsibleArea} onValueChange={setResponsibleArea}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar área" /></SelectTrigger>
                          <SelectContent>
                            {areas?.map((a) => (
                              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Actores / Agentes</Label>
                        <Textarea value={actors} onChange={(e) => setActors(e.target.value)} rows={2} />
                      </div>
                    </div>
                  </TabsContent>

                  {/* ODS */}
                  <TabsContent value="ods" className="space-y-4">
                    <div className="pt-4 space-y-4">
                      <p className="text-sm text-gray-500">Seleccioná los ODS relacionados y añadí una contribución para cada uno.</p>
                      {ods.map((item, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <Select
                            value={item.ods_id}
                            onValueChange={(v) => {
                              const newOds = [...ods];
                              newOds[i].ods_id = v;
                              setOds(newOds);
                            }}
                          >
                            <SelectTrigger className="w-40"><SelectValue placeholder="ODS" /></SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 17 }, (_, j) => (
                                <SelectItem key={j + 1} value={`ods_${j + 1}`}>ODS {j + 1}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={item.contribution}
                            onChange={(e) => {
                              const newOds = [...ods];
                              newOds[i].contribution = e.target.value;
                              setOds(newOds);
                            }}
                            placeholder="Contribución"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setOds(ods.filter((_, j) => j !== i))}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setOds([...ods, { ods_id: '', contribution: '' }])}
                      >
                        + Añadir ODS
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Presupuesto */}
                  <TabsContent value="presupuesto" className="space-y-4">
                    <div className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Monto</Label>
                          <Input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Moneda</Label>
                          <Select value={budgetCurrency} onValueChange={setBudgetCurrency}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CURRENCY_OPTIONS.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ejecutado</Label>
                          <Input type="number" value={budgetExecuted} onChange={(e) => setBudgetExecuted(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Fuente</Label>
                          <Input value={budgetSource} onChange={(e) => setBudgetSource(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Adicional */}
                  <TabsContent value="adicional" className="space-y-4">
                    <div className="pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Sitio web</Label>
                        <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <Label>URL de foto</Label>
                        <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Premios / Reconocimientos</Label>
                        <Textarea value={awards} onChange={(e) => setAwards(e.target.value)} rows={2} />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Evidencias */}
                  <TabsContent value="evidencias" className="space-y-4">
                    <div className="pt-4 space-y-4">
                      <p className="text-sm text-gray-500">
                        Agregá archivos o enlaces como evidencia de la acción. Se vincularán automáticamente al guardar.
                      </p>

                      {/* Pending files list */}
                      {pendingFiles.length > 0 && (
                        <div className="space-y-2 border rounded-lg p-3 max-h-32 overflow-y-auto">
                          {pendingFiles.map((f, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 truncate">
                                <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="truncate">{f.name}</span>
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 shrink-0"
                                onClick={() => setPendingFiles(files => files.filter((_, j) => j !== i))}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* File upload drop zone */}
                      <div
                        className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center cursor-pointer hover:border-blue-300 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setPendingFiles(prev => [...prev, file]);
                            e.target.value = '';
                          }}
                        />
                        <div className="flex flex-col items-center gap-1">
                          <Upload className="h-5 w-5 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            Click para seleccionar un archivo
                          </p>
                        </div>
                      </div>

                      {/* Pending URLs list */}
                      {pendingUrls.length > 0 && (
                        <div className="space-y-2 border rounded-lg p-3 max-h-32 overflow-y-auto">
                          {pendingUrls.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 truncate">
                                <LinkIcon className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="truncate text-blue-600">{item.url}</span>
                                <Badge variant="outline" className="text-[10px] shrink-0">{item.type}</Badge>
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 shrink-0"
                                onClick={() => setPendingUrls(urls => urls.filter((_, j) => j !== i))}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* URL input */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">O agregar un enlace</Label>
                        <Input
                          placeholder="https://..."
                          value={pendingUrl}
                          onChange={(e) => setPendingUrl(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!pendingUrl.trim()}
                            onClick={() => {
                              if (!pendingUrl.trim()) return;
                              setPendingUrls(prev => [...prev, { type: 'url', url: pendingUrl.trim() }]);
                              setPendingUrl('');
                            }}
                            className="flex-1"
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />URL
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!pendingUrl.trim()}
                            onClick={() => {
                              if (!pendingUrl.trim()) return;
                              setPendingUrls(prev => [...prev, { type: 'audiovisual', url: pendingUrl.trim() }]);
                              setPendingUrl('');
                            }}
                            className="flex-1"
                          >
                            <Video className="h-3 w-3 mr-1" />Audiovisual
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!pendingUrl.trim()}
                            onClick={() => {
                              if (!pendingUrl.trim()) return;
                              setPendingUrls(prev => [...prev, { type: 'press', url: pendingUrl.trim() }]);
                              setPendingUrl('');
                            }}
                            className="flex-1"
                          >
                            <Newspaper className="h-3 w-3 mr-1" />Prensa
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCreateOpen(false);
                      resetCreateForm();
                    }}
                    disabled={creating || uploadingEvidence}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleCreateAction} disabled={creating || uploadingEvidence}>
                    <Save className="mr-2 h-4 w-4" />
                    {uploadingEvidence ? 'Subiendo evidencias...' : creating ? 'Guardando...' : 'Crear Acción'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <ActionSelectorModal
              open={selectorOpen}
              onOpenChange={setSelectorOpen}
              evaluationId={evaluationId}
              indicatorId={indicatorId}
              destinationId={destinationId}
              onSuccess={handleLinkSuccess}
              alreadyLinkedIds={linkedActions.map((a: Action) => a.id)}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
