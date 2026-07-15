'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations, useLocale } from 'next-intl';
import { getScopeName } from '@/lib/scope-translations';
import { getRequirementName } from '@/lib/requirement-translations';
import { getIndicatorName } from '@/lib/indicator-translations';
import { toDateInputValue } from '@/lib/date-utils';
import { toast } from 'sonner';
import {
  getIndicatorValue,
  getScopes,
  getRequirements,
  saveDestinationValue,
  saveEvaluatorValue,
  getScopeIndicators,
} from '@/sdk/api/evaluations-api';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { IndicatorNavHeader } from '@/components/molecules/IndicatorNavHeader';
import { IndicatorCriteriaGrid } from '@/components/molecules/IndicatorCriteriaGrid';
import { ScopeIcon } from '@/components/atoms/ScopeIcon';
import { DestinationValueCard } from '@/components/molecules/DestinationValueCard';
import { EvaluatorValueCard } from '@/components/molecules/EvaluatorValueCard';

import { IndicatorHistoryTable } from '@/components/molecules/IndicatorHistoryTable';
import { IndicatorMessages } from '@/components/organisms/IndicatorMessages';
import { IndicatorActionsSection } from '@/components/organisms/IndicatorActionsSection';
import { useEvaluation } from '@/sdk/hooks/useEvaluations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/atoms/EmptyState';
import {
  MessageSquare,
  ClipboardList,
  RefreshCw,
  PanelTopOpen,
  ChevronDown,
  Target,
  ClipboardCheck,
} from 'lucide-react';
import {
  getUserName,
  hasAnyRole,
  EVALUATOR_ROLES,
  DESTINATION_ROLES,
} from '@/lib/auth';
import { getAxisLabel } from '@/lib/display-names';
import type { ApiError, IndicatorCriteria, IndicatorEditorProps } from '@/types';

const BLOCKED_STATUSES = new Set(['carga_finalizada', 'cerrada']);

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

// ====== INDICATOR EDITOR ======

export function IndicatorEditor({
  evaluationId,
  scopeId,
  indicatorId,
}: IndicatorEditorProps) {
  const router = useRouter();
  const userName = getUserName();
  const isEvaluator = hasAnyRole(EVALUATOR_ROLES);
  const isDestination = hasAnyRole(DESTINATION_ROLES);
  const t = useTranslations('evaluation');
  const ct = useTranslations('common');
  const locale = useLocale();

  // --- Evaluation status (for blocking edits) ---

  const { evaluation, mutate: mutateEval } = useEvaluation(evaluationId);
  const isBlocked = evaluation?.status ? BLOCKED_STATUSES.has(evaluation.status) : false;

  // --- Data fetching ---

  const {
    data: indicatorValue,
    isLoading: loadingValue,
    error: errorValue,
    mutate: mutateValue,
  } = useSWR(
    ['indicator-value', evaluationId, indicatorId],
    () => getIndicatorValue(evaluationId, indicatorId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
    },
  );

  const { data: scopes } = useSWR('scopes', () => getScopes(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });
  const { data: requirements } = useSWR('requirements', () => getRequirements(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const {
    data: allIndicators,
    isLoading: loadingNav,
  } = useSWR(
    ['scope-indicators', evaluationId, scopeId],
    () => getScopeIndicators(evaluationId, scopeId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  // Derive indicator from allIndicators (getIndicator endpoint doesn't exist)
  const indicator = allIndicators?.find((ind) => ind.id === indicatorId);

  // --- Local state ---

  const [destValue, setDestValue] = useState<string>('');
  const [evalValue, setEvalValue] = useState<string>('');
  const [meta, setMeta] = useState<string>('');
  const [metaDate, setMetaDate] = useState<string>('');
  const [destObs, setDestObs] = useState<string>('');
  const [evalObs, setEvalObs] = useState<string>('');
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState<'destination' | 'evaluator'>('destination');

  const [savingDest, setSavingDest] = useState(false);
  const [savingEval, setSavingEval] = useState(false);

  // --- Sync local state from API data ---
  // Resets form when navigating to a new indicator, but IGNORES SWR revalidations
  // that would overwrite unsaved user edits.
  const initializedRef = useRef(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const detailsOpenedRef = useRef(false);

  // Open <details> after mount so the browser doesn't auto-scroll.
  // Runs on every render, but only acts once when the element appears.
  useEffect(() => {
    if (detailsRef.current && !detailsOpenedRef.current) {
      detailsRef.current.open = true;
      detailsOpenedRef.current = true;
    }
  });

  // Reset flag when navigating to a different indicator
  useEffect(() => {
    detailsOpenedRef.current = false;
  }, [indicatorId]);
  const prevIndicatorIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!indicatorValue) return;

    const isFirstLoad = !initializedRef.current;
    const isNewIndicator = prevIndicatorIdRef.current !== indicatorId;
    if (isFirstLoad || isNewIndicator) {
      initializedRef.current = true;
      prevIndicatorIdRef.current = indicatorId;
      setDestValue(indicatorValue.destination_value != null ? String(indicatorValue.destination_value) : '');
      setEvalValue(indicatorValue.evaluator_value != null ? String(indicatorValue.evaluator_value) : '');
      setMeta(indicatorValue.meta != null ? String(indicatorValue.meta) : '');
      setMetaDate(toDateInputValue(indicatorValue.meta_date));
      setDestObs(indicatorValue.destination_observations || '');
      setEvalObs(indicatorValue.evaluator_observations || '');
      setIsEditingEnabled(indicatorValue.is_editing_enabled || false);
      setIsVerified(indicatorValue.is_verified || false);
    }
  }, [indicatorValue, indicatorId]);

  // --- Derived data ---

  const scope = scopes?.find((s) => s.id === scopeId);

  const requirement = requirements?.find((r) => r.id === (indicatorValue?.requirement?.id ?? indicator?.requirement_id));

  const indType = indicator?.type ?? indicatorValue?.indicator?.type ?? 'gradient';
  const isGradient = indType === 'gradient';
  const isBoolean = indType === 'boolean';

  // Criteria
  const criteria: IndicatorCriteria[] = indicator?.criteria ?? indicatorValue?.indicator?.criteria ?? [];

  // Progress towards meta
  const currentNumeric = destValue ? Number(destValue) : 0;
  const metaNumeric = meta ? Number(meta) : 0;
  // Navigation
  const indicatorList = allIndicators ?? [];
  const currentIdx = indicatorList.findIndex(
    (ind) => ind.id === indicatorId,
  );
  const prevIndicator = currentIdx > 0 ? indicatorList[currentIdx - 1] : null;
  const nextIndicator =
    currentIdx >= 0 && currentIdx < indicatorList.length - 1
      ? indicatorList[currentIdx + 1]
      : null;

  // --- Handlers ---

  const handleSaveDest = async () => {
    if (isBlocked) return;
    setSavingDest(true);
    try {
      const res = await saveDestinationValue(evaluationId, indicatorId, {
        destination_value: destValue ? Number(destValue) : undefined,
        meta: meta ? Number(meta) : undefined,
        meta_date: metaDate || undefined,
        destination_observations: destObs || undefined,
      });
      if (res.status_changed) {
        toast.success('La evaluación cambió de estado: borrador → en curso');
        mutateEval();
      } else {
        toast.success(t('indicator-editor.save-destination-success'));
      }
      await mutateValue();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('indicator-editor.save-destination-error')));
    } finally {
      setSavingDest(false);
    }
  };

  const handleSaveEval = async () => {
    if (isBlocked) return;
    setSavingEval(true);
    try {
      await saveEvaluatorValue(evaluationId, indicatorId, {
        evaluator_value: evalValue ? Number(evalValue) : undefined,
        evaluator_observations: evalObs || undefined,
      });
      toast.success(t('indicator-editor.save-evaluator-success'));
      await mutateValue();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('indicator-editor.save-evaluator-error')));
    } finally {
      setSavingEval(false);
    }
  };

  const handleVerifyChange = (checked: boolean) => {
    setIsVerified(checked);
    if (checked) {
      toast.success(t('indicator-editor.verified'));
    }
  };

  // --- Loading ---

  if (loadingValue || loadingNav) {
    return (
      <div className="px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-full max-w-md" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Error (non-404) ---

  const is404 = isApiError(errorValue) && errorValue.status === 404;
  const isEvaluatorContext = isEvaluator;

  if (errorValue && !is404) {
    return (
      <div className="px-6 py-6">
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" />}
          title={t('indicator-editor.error-title')}
          description={getErrorMessage(errorValue, t('indicator-editor.error-description'))}
          action={
            <Button variant="outline" onClick={() => mutateValue()}>
              <RefreshCw className="mr-2 h-4 w-4" /> {t('table.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  // --- Not found (non-404) ---

  if (!indicatorValue && !is404) {
    return (
      <div className="px-6 py-6">
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" />}
          title={t('indicator-editor.not-found-title')}
          description={t('indicator-editor.not-found-description')}
          action={
            <Button variant="outline" onClick={() => router.back()}>
              {t('indicator-editor.back')}
            </Button>
          }
        />
      </div>
    );
  }

  // Safe object for create mode (is404 with no indicatorValue yet)
  const indicatorData = indicatorValue?.indicator;
  const evaluatorNumeric = evalValue ? Number(evalValue) : null;

  // is404 or indicatorValue is null → show empty form (create mode)

  const indicatorCode = indicator?.code ?? indicatorData?.code ?? '';
  const indicatorName = getIndicatorName(indicator?.code ?? indicatorData?.code, locale, indicator?.name ?? indicatorData?.name ?? '');
  const indicatorDescription = indicator?.description ?? indicatorData?.description;

  // ====== RENDER ======

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {isBlocked && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            {t('indicator-editor.blocked')}
          </div>
        )}

        {/* ========== PAGE BREADCRUMB ========== */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <span className="text-sm font-medium text-zinc-600">
                {scope?.axis ? getAxisLabel(scope.axis, locale) : t('indicator-editor.axis')}
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Link href={`/evaluaciones/${evaluationId}?tab=ambitos`} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1.5">
                {scope ? <ScopeIcon icon={scope.icon} axis={scope.axis} acronym={scope.acronym} size="sm" /> : null}
                {getScopeName(scope?.acronym, locale, scope?.name || t('indicator-editor.scope'))}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-sm font-medium text-zinc-600">
                {requirement?.code}{requirement?.name ? ` · ${getRequirementName(requirement.code, locale, requirement.name)}` : ''}
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-sm font-semibold text-zinc-950">
                {indicatorCode || indicatorName || t('indicator-editor.indicator')}
              </span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* ========== NAVIGATION HEADER ========== */}
        <IndicatorNavHeader
          currentIndex={currentIdx}
          totalCount={indicatorList.length}
          prevIndicatorId={prevIndicator?.id ?? null}
          nextIndicatorId={nextIndicator?.id ?? null}
          evaluationId={evaluationId}
          scopeId={scopeId}
          indicatorId={indicatorId}
        />

        {/* ========== TITLE ========== */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
              {indicatorCode && `${indicatorCode} — `}{indicatorName || t('indicator-editor.indicator')}
            </h1>
            {is404 && <Badge variant="secondary">{t('indicator-editor.new')}</Badge>}
          </div>
          {requirement?.description && (
            <p className="max-w-5xl text-sm leading-6 text-zinc-500">
              {requirement.description}
            </p>
          )}
          {indicatorDescription && (
            <p className="max-w-5xl text-sm leading-6 text-zinc-600">
              {indicatorDescription}
            </p>
          )}
        </div>

        {/* ========== DESCRIPTION + CRITERIA GRID ========== */}
        <IndicatorCriteriaGrid
          criteria={criteria}
          currentValue={currentNumeric}
          evaluatorValue={evaluatorNumeric}
          indicatorType={indType}
        />

        {/* ========== DESTINATION + EVALUATOR UNIFIED CARD ========== */}
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
                    {activeTab === 'evaluator' ? 'Carga evaluador' : (isEvaluatorContext && !isDestination ? 'Carga del destino — contexto' : 'Carga destino')}
                  </CardTitle>
                  <p className="mt-1 text-sm text-zinc-500">
                    {activeTab === 'evaluator'
                      ? 'Completá el valor evaluador, las observaciones y marcar como verificado si corresponde.'
                      : (isEvaluatorContext && !isDestination
                        ? 'Revisá el valor, la meta, la fecha y las observaciones cargadas por el destino.'
                        : 'Completá el valor actual, la meta y las observaciones del destino.')
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-zinc-100 rounded-[10px] p-1">
                <button
                  onClick={() => setActiveTab('destination')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-[8px] transition-colors ${
                    activeTab === 'destination'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  <Target className="h-4 w-4" />
                  Destino
                </button>
                {isEvaluatorContext && (
                  <button
                    onClick={() => setActiveTab('evaluator')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-[8px] transition-colors ${
                      activeTab === 'evaluator'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Evaluador
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'destination' && (
              <DestinationValueCard
                key={`dest-${indicatorId}`}
                indicatorType={indType}
                destValue={destValue}
                onDestValueChange={setDestValue}
                isDestination={isDestination}
                meta={meta}
                onMetaChange={setMeta}
                metaDate={metaDate}
                onMetaDateChange={setMetaDate}
                metaNumeric={metaNumeric}
                currentNumeric={currentNumeric}
                destObs={destObs}
                onDestObsChange={setDestObs}
                saving={savingDest}
                onSave={handleSaveDest}
                disabled={isBlocked}
                readOnlyContext={isEvaluatorContext && !isDestination}
                isPromoted={!!(indicatorValue && indicatorValue.evaluation_id !== evaluationId)}
                criteria={criteria}
                noShell
              />
            )}
            {activeTab === 'evaluator' && isEvaluatorContext && (
              <EvaluatorValueCard
                key={`eval-${indicatorId}`}
                indicatorType={indType}
                evalValue={evalValue}
                onEvalValueChange={setEvalValue}
                evalObs={evalObs}
                onEvalObsChange={setEvalObs}
                isEditingEnabled={isEditingEnabled}
                onEditingEnabledChange={(checked) => setIsEditingEnabled(checked)}
                isVerified={isVerified}
                onVerifiedChange={handleVerifyChange}
                saving={savingEval}
                onSave={handleSaveEval}
                disabled={isBlocked}
                previousValue={indicatorValue?.evaluator_value != null ? String(indicatorValue.evaluator_value) : null}
                criteria={criteria}
                userName={userName}
                noShell
              />
            )}
          </CardContent>
        </Card>

        {/* ========== ACTIONS, ANALYSIS, HISTORY, MESSAGES ========== */}
        <details ref={detailsRef} className="group rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
                <PanelTopOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-950">{t('indicator-editor.details-title')}</h2>
                <p className="text-sm text-zinc-500">
                  {t('indicator-editor.details-description')}
                </p>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-zinc-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-6 border-t border-zinc-100 p-5">
            <IndicatorActionsSection
              evaluationId={evaluationId}
              indicatorId={indicatorId}
            />

            <Separator />

            <IndicatorHistoryTable
              history={indicatorValue?.history}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  {t('indicator-editor.messages')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <IndicatorMessages
                  evaluationId={evaluationId}
                  indicatorId={indicatorId}
                  indicatorValueId={indicatorValue?.id}
                  readOnly={false}
                />
              </CardContent>
            </Card>
          </div>
        </details>
      </div>
    </div>
  );
}
