'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useTranslations, useLocale } from 'next-intl';
import { getIndicatorName } from '@/lib/indicator-translations';
import {
  getIndicatorValue,
  getScopes,
  getRequirements,
  getScopeIndicators,
} from '@/sdk/api/evaluations-api';
import { IndicatorNavHeader } from '@/components/molecules/IndicatorNavHeader';
import { IndicatorCriteriaGrid } from '@/components/molecules/IndicatorCriteriaGrid';
import { DestinationViewCard } from '@/components/molecules/DestinationViewCard';
import { EvaluatorViewCard } from '@/components/molecules/EvaluatorViewCard';
import { AiAnalysisCard } from '@/components/molecules/AiAnalysisCard';
import { IndicatorHistoryTable } from '@/components/molecules/IndicatorHistoryTable';
import { IndicatorMessages } from '@/components/organisms/IndicatorMessages';
import { IndicatorActionsSection } from '@/components/organisms/IndicatorActionsSection';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/atoms/EmptyState';
import {
  MessageSquare,
  ClipboardList,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { getAxisLabel } from '@/lib/display-names';
import { formatDate } from '@/lib/date-utils';
import type { IndicatorCriteria, IndicatorViewProps } from '@/types';

// ====== INDICATOR VIEW ======

export function IndicatorView({
  evaluationId,
  scopeId,
  indicatorId,
}: IndicatorViewProps) {
  const router = useRouter();
  const t = useTranslations('evaluation');
  const ct = useTranslations('common');
  const locale = useLocale();

  // --- Data fetching ---

  const {
    data: indicatorValue,
    isLoading: loadingValue,
    error: errorValue,
    mutate: mutateValue,
  } = useSWR(
    ['indicator-value', evaluationId, indicatorId],
    () => getIndicatorValue(evaluationId, indicatorId),
  );

  const { data: scopes } = useSWR('scopes', () => getScopes());
  const { data: requirements } = useSWR('requirements', () => getRequirements());

  const {
    data: allIndicators,
    isLoading: loadingNav,
  } = useSWR(
    ['scope-indicators', evaluationId, scopeId],
    () => getScopeIndicators(evaluationId, scopeId),
  );

  // --- Derived data ---

  const indicator = useMemo(
    () => allIndicators?.find((ind: any) => ind.id === indicatorId),
    [allIndicators, indicatorId],
  );

  const scope = useMemo(
    () => scopes?.find((s) => s.id === scopeId),
    [scopes, scopeId],
  );

  const requirement = useMemo(
    () => requirements?.find((r) => r.id === (indicatorValue?.requirement?.id ?? indicator?.requirement_id)),
    [requirements, indicatorValue, indicator],
  );

  const indType = indicator?.type ?? indicatorValue?.indicator?.type ?? 'gradient';
  const isGradient = indType === 'gradient';
  const isBoolean = indType === 'boolean';

  const criteria: IndicatorCriteria[] = indicator?.criteria ?? indicatorValue?.indicator?.criteria ?? [];

  const currentNumeric = indicatorValue?.destination_value ?? 0;
  const metaNumeric = indicatorValue?.meta ?? 0;

  // Navigation
  const indicatorList = allIndicators ?? [];
  const currentIdx = indicatorList.findIndex(
    (ind: any) => ind.id === indicatorId,
  );
  const prevIndicator = currentIdx > 0 ? indicatorList[currentIdx - 1] : null;
  const nextIndicator =
    currentIdx >= 0 && currentIdx < indicatorList.length - 1
      ? indicatorList[currentIdx + 1]
      : null;

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

  const is404 = errorValue && (errorValue as any).status === 404;

  if (errorValue && !is404) {
    return (
      <div className="px-6 py-6">
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" />}
          title={t('indicator-editor.error-title')}
          description={errorValue.message || t('indicator-editor.error-description')}
          action={
            <Button variant="outline" onClick={() => mutateValue()}>
              <RefreshCw className="mr-2 h-4 w-4" /> {t('table.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  // --- Derived display values ---

  const indicatorCode = indicator?.code ?? '';
  const indicatorName = getIndicatorName(indicator?.code, locale, indicator?.name ?? '');

  const formatValue = (v: number | undefined | null): string => {
    if (v == null) return '-';
    return isGradient ? `${v}%` : isBoolean ? (v === 100 ? t('criteria.yes') : v === 0 ? t('criteria.no') : String(v)) : String(v);
  };

  const hasData = !!indicatorValue;

  // ====== RENDER ======

  return (
    <div className="px-6 py-6 space-y-6">
      <IndicatorNavHeader
        currentIndex={currentIdx}
        totalCount={indicatorList.length}
        prevIndicatorId={prevIndicator?.id ?? null}
        nextIndicatorId={nextIndicator?.id ?? null}
        evaluationId={evaluationId}
        scopeId={scopeId}
        indicatorId={indicatorId}
        mode="view"
      />

      {/* ========== CONTENT: shows real data or empty placeholders ========== */}
      {hasData ? (
        <>
          {/* TITLE */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {indicatorCode && `${indicatorCode} — `}{indicatorName || t('indicator-editor.indicator')}
            </h1>
            {requirement?.description && (
              <p className="max-w-5xl text-sm leading-6 text-zinc-500">
                {requirement.description}
              </p>
            )}
            {indicator?.description && (
              <p className="max-w-5xl text-sm leading-6 text-zinc-600">
                {indicator.description}
              </p>
            )}
          </div>

          {/* ========== DESCRIPTION + CRITERIA GRID ========== */}
          <IndicatorCriteriaGrid
            criteria={criteria}
            currentValue={currentNumeric}
            indicatorType={indType}
          />

          {/* ========== DESTINATION SECTION ========== */}
          <DestinationViewCard
            indicatorType={indType}
            destValue={formatValue(indicatorValue.destination_value)}
            meta={indicatorValue.meta != null ? String(indicatorValue.meta) : '-'}
            metaDate={indicatorValue.meta_date ? formatDate(indicatorValue.meta_date, locale) : '-'}
            currentNumeric={currentNumeric}
            metaNumeric={metaNumeric}
            destObs={indicatorValue.destination_observations || t('evaluator-view.no-observations')}
            isPromoted={indicatorValue.evaluation_id !== evaluationId}
          />

          {/* ========== EVALUATOR SECTION ========== */}
          <EvaluatorViewCard
            indicatorType={indType}
            evalValue={formatValue(indicatorValue.evaluator_value)}
            evalObs={indicatorValue.evaluator_observations || t('evaluator-view.no-observations')}
            isEditingEnabled={indicatorValue.is_editing_enabled || false}
            isVerified={indicatorValue.is_verified || false}
            previousValue={indicatorValue.evaluator_value != null ? formatValue(indicatorValue.evaluator_value) : null}
            verifiedBy={indicatorValue.verified_by}
            verifiedAt={indicatorValue.verified_at}
            userName=""
          />

          {/* ========== AI SUGGESTIONS ========== */}
          {indicatorValue.sugerencias_mejora_ia && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  {t('indicator-editor.ai-suggestions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="rounded-md border bg-gray-50 px-3 py-2 text-sm">
                  {indicatorValue.sugerencias_mejora_ia}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ========== AI ANALYSIS ========== */}
          <AiAnalysisCard
            analysisText={indicatorValue.analisis_ia}
            isDestination={false}
            analyzing={false}
            onAnalyze={() => {}}
          />

          {/* ========== LINKED ACTIONS ========== */}
          <IndicatorActionsSection
            evaluationId={evaluationId}
            indicatorId={indicatorId}
            readOnly
          />

          <Separator />

          {/* ========== HISTORY SECTION ========== */}
          <IndicatorHistoryTable
            history={indicatorValue.history}
          />

          {/* ========== MESSAGES SECTION ========== */}
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
        </>
      ) : (
        <>
          {/* TITLE */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {indicatorCode && `${indicatorCode} — `}{indicatorName || t('indicator-editor.indicator')}
            </h1>
            {requirement?.description && (
              <p className="max-w-5xl text-sm leading-6 text-zinc-500">
                {requirement.description}
              </p>
            )}
            {indicator?.description && (
              <p className="max-w-5xl text-sm leading-6 text-zinc-600">
                {indicator.description}
              </p>
            )}
          </div>

          {/* EMPTY VALUES PLACEHOLDER */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('criteria.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-md text-center border border-dashed border-gray-300">
                  <p className="text-xs text-gray-500 mb-1">{t('criteria.destination-value')}</p>
                  <p className="text-2xl font-bold text-gray-400">—</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md text-center border border-dashed border-gray-300">
                  <p className="text-xs text-gray-500 mb-1">{t('criteria.evaluator-value')}</p>
                  <p className="text-2xl font-bold text-gray-400">—</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">
                {t('destination-card.no-value')}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
