'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useDtiPlans } from '@/sdk/hooks/useDtiPlans';
import {
  createDtiPlan,
  getDtiPlan,
  updateDtiPlan,
  deleteDtiPlan,
  getActions,
  getScopes,
  getAxes,
} from '@/sdk/api/evaluations-api';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { ActionFilters, type ActionStatusFilter } from '@/components/organisms/plan/ActionFilters';
import { ActionGroupCards } from '@/components/organisms/plan/ActionGroupCards';
import PlanManager from '@/components/organisms/plan/PlanManager';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useDestino } from '@/context/destino-context';
import { formatDate } from '@/lib/date-utils';
import { Edit, Plus, Trash2, X } from 'lucide-react';
import type { Action, ActionStatus, DtiPlan, IndicatorLink } from '@/types';

const ACTION_ACTIVE_STATUS = {
  IDEA: 'idea',
  PLANNING: 'en_planificacion',
  EXECUTION: 'en_ejecucion',
} as const satisfies Record<string, ActionStatus>;

const ACTION_DONE_STATUS = {
  DONE: 'finalizada',
  DISCARDED: 'descartada',
} as const satisfies Record<string, ActionStatus>;

const EDIT_STATUS_OPTIONS = {
  ACTIVE: 'activo',
  CLOSED: 'cerrado',
} as const;

export default function DtiPlanPage() {
  const t = useTranslations('page.plan');
  const ct = useTranslations('common');
  const bt = useTranslations('breadcrumb');
  const { activeDestino, setActiveDestino, canSelectDestino } = useDestino();
  const locale = useLocale();

  const { plans, isLoading, mutate } = useDtiPlans(activeDestino?.id);
  const { data: scopesList } = useSWR('scopes-plan', () => getScopes());
  const { data: axesList } = useSWR('axes-plan', () => getAxes());
  const { data: allActions } = useSWR(
    activeDestino?.id ? ['plan-actions', activeDestino.id] : null,
    () => getActions(activeDestino!.id),
  );

  // Plan selection — no auto-select, user picks from grid
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const { data: selectedPlan, mutate: mutatePlan } = useSWR(
    selectedPlanId ? `dti-plan/${selectedPlanId}` : null,
    () => getDtiPlan(selectedPlanId!),
  );

  // F4-06: Filter state
  const [filterAxes, setFilterAxes] = useState<string[]>([]);
  const [filterScopes, setFilterScopes] = useState<string[]>([]);
  const [filterIndicator, setFilterIndicator] = useState('');
  const [filterStatus, setFilterStatus] = useState<ActionStatusFilter>('');
  const [filterResponsable, setFilterResponsable] = useState('');
  const [filterHorizon, setFilterHorizon] = useState('');

  useEffect(() => {
    setPlanDest(activeDestino?.id ?? '');
  }, [activeDestino?.id]);

  const responsablesSet = new Set<string>();
  (allActions ?? []).forEach((action) => {
    if (action.responsible_person) responsablesSet.add(action.responsible_person);
  });
  const responsables = Array.from(responsablesSet).sort();

  const filteredActions = (allActions ?? []).filter((action: Action) => {
    if (filterAxes.length > 0 && !filterAxes.some((ax) => (action.axes || []).some((axis) => axis.toLowerCase() === ax.toLowerCase()))) return false;
    if (filterScopes.length > 0 && !filterScopes.some((sc) => (action.scopes || []).some((scope) => scope.toLowerCase() === sc.toLowerCase()))) return false;
    if (filterIndicator.trim()) {
      const query = filterIndicator.toLowerCase();
      const linked = action.linked_indicators || [];
      if (!linked.some((link: IndicatorLink) => (link.indicator_name || '').toLowerCase().includes(query) || (link.indicator_code || '').toLowerCase().includes(query))) return false;
    }
    if (filterStatus && action.status !== filterStatus) return false;
    if (filterResponsable && filterResponsable !== 'all' && action.responsible_person !== filterResponsable) return false;
    if (filterHorizon && filterHorizon !== 'all' && action.horizon !== filterHorizon) return false;
    return true;
  });

  const groupedActions = {
    active: filteredActions.filter((action) => action.status !== ACTION_DONE_STATUS.DONE && action.status !== ACTION_DONE_STATUS.DISCARDED),
    achieved: filteredActions.filter((action) => action.status === ACTION_DONE_STATUS.DONE),
    discarded: filteredActions.filter((action) => action.status === ACTION_DONE_STATUS.DISCARDED),
  };

  const actionMetrics = {
    total: filteredActions.length,
    inExecution: filteredActions.filter((action) => action.status === ACTION_ACTIVE_STATUS.EXECUTION).length,
    completed: groupedActions.achieved.length,
    planned: filteredActions.filter((action) => action.status === ACTION_ACTIVE_STATUS.IDEA || action.status === ACTION_ACTIVE_STATUS.PLANNING).length,
  };

  // ========== Create plan dialog ==========
  const [createOpen, setCreateOpen] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planDest, setPlanDest] = useState(activeDestino?.id ?? '');
  const [planStart, setPlanStart] = useState('');
  const [planEnd, setPlanEnd] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreatePlan = async (e: FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !planDest || !planStart || !planEnd) {
      toast.error(t('create.validation'));
      return;
    }
    setCreating(true);
    try {
      await createDtiPlan({
        destination_id: planDest,
        name: planName.trim(),
        start_date: planStart,
        end_date: planEnd,
      });
      setCreateOpen(false);
      setPlanName('');
      setPlanStart('');
      setPlanEnd('');
      await mutate();
    } catch (err) {
      toast.error(t('create.error'));
    } finally {
      setCreating(false);
    }
  };

  // ========== Edit plan dialog ==========
  const [editOpen, setEditOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<DtiPlan | null>(null);
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [editing, setEditing] = useState(false);

  const openEditDialog = (plan: DtiPlan) => {
    setEditPlan(plan);
    setEditName(plan.name);
    setEditStart(plan.start_date.split('T')[0]);
    setEditEnd(plan.end_date.split('T')[0]);
    setEditStatus(plan.status);
    setEditOpen(true);
  };

  const handleEditPlan = async (e: FormEvent) => {
    e.preventDefault();
    if (!editPlan || !editName.trim() || !editStart || !editEnd) return;
    setEditing(true);
    try {
      await updateDtiPlan(editPlan.id, {
        name: editName.trim(),
        start_date: editStart,
        end_date: editEnd,
        status: editStatus as DtiPlan['status'],
      });
      setEditOpen(false);
      setEditPlan(null);
      toast.success(t('edit.success'));
      await mutate();
      if (selectedPlanId === editPlan.id) await mutatePlan();
    } catch (err) {
      toast.error(t('edit.error'));
    } finally {
      setEditing(false);
    }
  };

  // ========== Delete plan ==========
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DtiPlan | null>(null);

  const openDeleteDialog = (plan: DtiPlan) => {
    setDeleteTarget(plan);
    setDeleteOpen(true);
  };

  const handleDeletePlan = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDtiPlan(deleteTarget.id);
      if (selectedPlanId === deleteTarget.id) setSelectedPlanId(null);
      toast.success(t('delete.success'));
      await mutate();
    } catch (err) {
      toast.error(t('delete.error'));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBack = () => {
    setSelectedPlanId(null);
  };

  // ========== Grid view: when no plan is selected ==========
  const isGridView = selectedPlanId === null;

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-zinc-500 text-sm">{bt('destino')}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-zinc-500 text-sm">{bt('planificar')}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium text-zinc-900">{t('title')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Destination chip — only for roles that can switch destinations */}
      {canSelectDestino && activeDestino && (
        <div className="flex items-center gap-2">
          <div className="border border-zinc-200 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white flex items-center gap-2">
            <span>{activeDestino.name}</span>
            <button
              onClick={() => setActiveDestino(null)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
              aria-label={t('clear-destino')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {isGridView ? (
        /* ========================================
           SCREEN 1: Plan Grid
           ======================================== */
        <div className="space-y-6">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#040927]">{t('grid.title')}</h1>
              <p className="text-sm text-zinc-500 mt-1">{t('description')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {activeDestino && (
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" />{t('new-plan')}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{t('create.title')}</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreatePlan} className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('create.name')}</Label>
                        <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder={t('create.name-placeholder')} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('create.destino')}</Label>
                        <p className="text-sm border border-zinc-200 rounded-[9px] px-3 py-2 text-zinc-700 bg-zinc-50">
                          {activeDestino!.name}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('create.start-date')}</Label>
                          <Input type="date" value={planStart} onChange={(e) => setPlanStart(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('create.end-date')}</Label>
                          <Input type="date" value={planEnd} onChange={(e) => setPlanEnd(e.target.value)} />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={creating}>
                        {creating ? t('create.creating') : t('create.submit')}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Plan cards grid */}
          {!activeDestino ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <p>{t('empty')}</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
              {t('manager.no-plans')}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="hover:border-[#040927]/20 transition-colors">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        className="text-left font-semibold text-zinc-900 hover:text-[#040927] transition-colors leading-snug cursor-pointer"
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        {plan.name}
                      </button>
                      <Badge variant={plan.status === 'activo' ? 'success' : 'secondary'}>
                        {plan.status === 'activo' ? t('manager.active') : t('manager.closed')}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {formatDate(plan.start_date, locale)} – {formatDate(plan.end_date, locale)}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        {ct('edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                        onClick={() => openDeleteDialog(plan)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        {ct('delete')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ========================================
           SCREEN 2: Plan Detail
           ======================================== */
        <PlanManager
          plans={plans}
          isLoading={isLoading}
          selectedPlan={selectedPlan}
          selectedPlanId={selectedPlanId}
          onSelectPlan={setSelectedPlanId}
          onPlanMutate={mutatePlan}
          onBack={handleBack}
          destinationName={activeDestino?.name}
          actionMetrics={actionMetrics}
          actionsSection={activeDestino ? (
            <div className="space-y-4">
              <ActionFilters
                filterAxes={filterAxes}
                setFilterAxes={setFilterAxes}
                filterScopes={filterScopes}
                setFilterScopes={setFilterScopes}
                filterIndicator={filterIndicator}
                setFilterIndicator={setFilterIndicator}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterResponsable={filterResponsable}
                setFilterResponsable={setFilterResponsable}
                filterHorizon={filterHorizon}
                setFilterHorizon={setFilterHorizon}
                axesList={axesList ?? []}
                scopesList={scopesList ?? []}
                responsables={responsables}
              />
              <ActionGroupCards groupedActions={groupedActions} />
            </div>
          ) : null}
        />
      )}

      {/* Edit plan dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('edit.title')}</DialogTitle></DialogHeader>
          <form onSubmit={handleEditPlan} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('edit.name')}</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t('create.name-placeholder')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('edit.start-date')}</Label>
                <Input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('edit.end-date')}</Label>
                <Input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('edit.status')}</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={t('edit.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EDIT_STATUS_OPTIONS.ACTIVE}>{t('manager.active')}</SelectItem>
                  <SelectItem value={EDIT_STATUS_OPTIONS.CLOSED}>{t('manager.closed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={editing}>
              {editing ? ct('saving') : t('edit.submit')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('delete.title')}
        description={t('delete.description')}
        onConfirm={handleDeletePlan}
        confirmText={ct('delete')}
        variant="destructive"
      />
    </div>
  );
}
