'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { GradientSelect } from '@/components/atoms/GradientSelect';
import { BooleanSelect } from '@/components/atoms/BooleanSelect';
import { displayName } from '@/lib/display-names';
import { getIndicatorName } from '@/lib/indicator-translations';
import { formatDate } from '@/lib/date-utils';
import { IndicatorSelect } from '@/components/molecules/IndicatorSelect';
import { ArrowLeft, CalendarDays, Download, Edit, Flag, ListChecks, PlayCircle, Plus, Target, Trophy } from 'lucide-react';
import { addDtiPlanGoal, getIndicator } from '@/sdk/api/evaluations-api';
import type { DtiPlan, DtiPlanGoal, Indicator } from '@/types';

interface PlanActionMetrics {
  total: number;
  inExecution: number;
  completed: number;
  planned: number;
}

interface PlanManagerProps {
  plans: DtiPlan[];
  isLoading: boolean;
  selectedPlan: (DtiPlan & { goals?: DtiPlanGoal[] }) | null | undefined;
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  onPlanMutate?: () => void;
  onBack?: () => void;
  destinationName?: string;
  actionMetrics: PlanActionMetrics;
  actionsSection: ReactNode;
}

export default function PlanManager({
  plans,
  isLoading,
  selectedPlan,
  selectedPlanId,
  onSelectPlan,
  onPlanMutate,
  onBack,
  destinationName,
  actionMetrics,
  actionsSection,
}: PlanManagerProps) {
  const t = useTranslations('page.plan');
  const locale = useLocale();
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalIndicatorId, setGoalIndicatorId] = useState('');
  const [goalIndicatorType, setGoalIndicatorType] = useState<string>('');
  const [goalTargetScore, setGoalTargetScore] = useState(100);
  const [goalTargetDate, setGoalTargetDate] = useState('');

  const handleIndicatorSelect = (indicator: Indicator) => {
    setGoalIndicatorType(indicator.type);
    setGoalTargetScore(indicator.type === 'gradient' ? 0 : indicator.type === 'boolean' ? 0 : 100);
  };

  /** Resolves the indicator name from API when the goal doesn't include it */
  function GoalIndicatorLabel({ goal }: { goal: DtiPlanGoal }) {
    if (goal.indicator_name || goal.indicator_code) {
      return <>{displayName(goal, 'indicator_id', 'indicator_name') || goal.indicator_code}</>;
    }
    return <IndicatorNameFetcher indicatorId={goal.indicator_id} />;
  }

  function IndicatorNameFetcher({ indicatorId }: { indicatorId: string }) {
    const { data: indicator } = useSWR(
      indicatorId ? `indicator-${indicatorId}` : null,
      () => getIndicator(indicatorId),
    );
    return <>{getIndicatorName(indicator?.code, locale, indicator?.name ?? indicatorId.slice(0, 8))}</>;
  }

  const handleAddGoal = async () => {
    if (!selectedPlanId || !goalIndicatorId) return;
    try {
      await addDtiPlanGoal(selectedPlanId, {
        indicator_id: goalIndicatorId,
        target_score: goalTargetScore,
        target_date: goalTargetDate || undefined,
      });
      setGoalOpen(false);
      setGoalIndicatorId('');
      setGoalIndicatorType('');
      setGoalTargetScore(100);
      setGoalTargetDate('');
      onPlanMutate?.();
    } catch (err) {
      toast.error(t('manager.add-goal-error'));
    }
  };
  if (!destinationName) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>{t('empty')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!onBack && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('manager.plans')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-3 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
                {t('manager.no-plans')}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    className={`rounded-xl border p-4 text-left transition-colors hover:border-[#040927]/20 hover:bg-[#040927]/5 ${selectedPlanId === plan.id ? 'border-[#040927] bg-[#040927]/5 shadow-sm' : 'border-zinc-200 bg-white'}`}
                    onClick={() => onSelectPlan(plan.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-900">{plan.name}</p>
                      <Badge variant={plan.status === 'activo' ? 'success' : 'secondary'}>
                        {plan.status === 'activo' ? t('manager.active') : t('manager.closed')}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      {formatDate(plan.start_date, locale)} - {formatDate(plan.end_date, locale)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedPlan ? (
        <div className="space-y-6">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="-ml-2 text-zinc-600 hover:text-zinc-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back-to-plans')}
            </Button>
          )}
          <Card className="overflow-hidden border-[#040927]/10">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-[#040927] to-[#131c52] px-6 py-6 text-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-white/90">{t('title')} DTI</p>
                      <Badge variant={selectedPlan.status === 'activo' ? 'success' : 'secondary'}>
                        {selectedPlan.status === 'activo' ? t('manager.active') : t('manager.closed')}
                      </Badge>
                    </div>
                    <h2 className="mt-2 text-2xl font-bold text-white">{selectedPlan.name}</h2>
                    <p className="mt-1 text-sm text-white/80">{destinationName}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
                      <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(selectedPlan.start_date, locale)}</span>
                      <span>→</span>
                      <span>{formatDate(selectedPlan.end_date, locale)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" disabled><Edit className="mr-2 h-4 w-4" />{t('manager.edit-plan')}</Button>
                    <Button type="button" variant="secondary" disabled><Download className="mr-2 h-4 w-4" />{t('manager.export')}</Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={<ListChecks className="h-5 w-5" />} label={t('metrics.total')} value={actionMetrics.total} />
                <MetricCard icon={<PlayCircle className="h-5 w-5" />} label={t('metrics.in-execution')} value={actionMetrics.inExecution} />
                <MetricCard icon={<Trophy className="h-5 w-5" />} label={t('metrics.completed')} value={actionMetrics.completed} />
                <MetricCard icon={<Flag className="h-5 w-5" />} label={t('metrics.planned')} value={actionMetrics.planned} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{t('manager.goals-title')}</CardTitle>
                  <p className="mt-1 text-sm text-zinc-500">{t('manager.goals-description')}</p>
                </div>
                <Dialog open={goalOpen} onOpenChange={(open) => {
                  if (open) {
                    setGoalIndicatorId('');
                    setGoalIndicatorType('');
                    setGoalTargetScore(100);
                    setGoalTargetDate('');
                  }
                  setGoalOpen(open);
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t('manager.add-goal')}</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg overflow-hidden">
                    <DialogHeader><DialogTitle>{t('manager.add-goal-title')}</DialogTitle></DialogHeader>
                    <div className="space-y-4 overflow-hidden">
                      <div className="space-y-2">
                        <Label>{t('manager.form.indicator')}</Label>
                        <IndicatorSelect
                          value={goalIndicatorId}
                          onChange={(id) => { setGoalIndicatorId(id); setGoalIndicatorType(''); }}
                          onIndicatorSelect={handleIndicatorSelect}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('manager.form.target-score')}</Label>
                        {goalIndicatorType === 'gradient' ? (
                          <GradientSelect
                            value={String(goalTargetScore)}
                            onChange={(v) => setGoalTargetScore(Number(v))}
                          />
                        ) : goalIndicatorType === 'boolean' ? (
                          <BooleanSelect
                            value={goalTargetScore === 1 ? 'Sí' : goalTargetScore === 0 ? 'No' : ''}
                            onChange={(v) => setGoalTargetScore(v === 'Sí' ? 1 : 0)}
                          />
                        ) : (
                          <Input
                            type="number"
                            min={0}
                            value={goalTargetScore}
                            onChange={(e) => setGoalTargetScore(Number(e.target.value))}
                            placeholder={goalIndicatorType ? 'Valor numérico (0+)' : 'Seleccioná un indicador primero'}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>{t('manager.form.target-date')}</Label>
                        <Input type="date" value={goalTargetDate} onChange={(e) => setGoalTargetDate(e.target.value)} />
                      </div>
                      <Button onClick={handleAddGoal} className="w-full">{t('manager.form.add')}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selectedPlan.goals?.length ? (
                <div className="overflow-hidden rounded-xl border border-zinc-200">
                  <div className="grid grid-cols-12 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <div className="col-span-5">{t('manager.table.indicator')}</div>
                    <div className="col-span-2 text-center">{t('manager.table.current')}</div>
                    <div className="col-span-2 text-center">{t('manager.table.target')}</div>
                    <div className="col-span-3 text-right">{t('manager.table.target-date')}</div>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {selectedPlan.goals.map((goal) => (
                      <div key={goal.id} className="grid grid-cols-12 items-center gap-3 px-4 py-4 text-sm">
                        <div className="col-span-12 font-medium text-zinc-900 md:col-span-5"><GoalIndicatorLabel goal={goal} /></div>
                        <div className="col-span-4 md:col-span-2">
                          <ScorePill value={goal.current_score ?? 0} tone="secondary" />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <ScorePill value={goal.target_score} tone="primary" />
                        </div>
                        <div className="col-span-4 text-right text-zinc-600 md:col-span-3">
                          {goal.target_date ? formatDate(goal.target_date, locale) : t('manager.no-date')}
                        </div>
                        <div className="col-span-12">
                          <Progress value={(goal.current_score ?? 0) / (goal.target_score || 1) * 100} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
                  {t('manager.no-goals')}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">{t('actions.title')}</h3>
              <p className="text-sm text-zinc-500">{t('actions.description')}</p>
            </div>
            {actionsSection}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>{t('manager.select-plan')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
        </div>
        <div className="rounded-full bg-[#040927]/5 p-3 text-[#040927]">{icon}</div>
      </div>
    </div>
  );
}

function ScorePill({ value, tone }: { value: number; tone: 'primary' | 'secondary' }) {
  return (
    <span className={`inline-flex min-w-16 justify-center rounded-full px-3 py-1 text-xs font-semibold ${tone === 'primary' ? 'bg-[#040927]/10 text-[#040927]' : 'bg-zinc-100 text-zinc-700'}`}>
      {value}%
    </span>
  );
}
