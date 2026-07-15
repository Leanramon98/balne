'use client';

import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEvaluation } from '@/sdk/hooks/useEvaluations';
import { getScopes, getScopeProgress, getRequirements, getActions, getScopeIndicators } from '@/sdk/api/evaluations-api';
import { getScopeName } from '@/lib/scope-translations';
import useSWR from 'swr';
import { ScopeDetailLayout } from '@/components/templates/ScopeDetailLayout';
import { IndicatorTable } from '@/components/organisms/IndicatorTable';

interface ScopeIndicatorStatsRow {
  destination_value?: number;
}

export default function ScopeIndicatorsPage() {
  const params = useParams();
  const evaluationId = params.id as string;
  const scopeId = params.scopeId as string;

  const { evaluation } = useEvaluation(evaluationId);
  const { data: scopes } = useSWR('scopes', () => getScopes());
  const { data: progressList } = useSWR(
    evaluationId ? `scope-progress-${evaluationId}` : null,
    () => getScopeProgress(evaluationId),
  );
  const { data: requirements } = useSWR(
    scopeId ? `requirements-${scopeId}` : null,
    () => getRequirements(scopeId),
  );
  const { data: scopeActions } = useSWR(
    scopeId ? `actions-scope-${scopeId}` : null,
    () => getActions({ scopeId }),
  );
  const { data: rawScopeIndicators } = useSWR(
    evaluationId && scopeId ? `evaluation/${evaluationId}/scope/${scopeId}/indicators` : null,
    () => getScopeIndicators(evaluationId, scopeId),
  );

  const scope = scopes?.find((s) => s.id === scopeId);
  const locale = useLocale();
  const scopeProgress = progressList?.find((p) => p.scope_id === scopeId);
  const scopeIndicators = (rawScopeIndicators ?? []) as ScopeIndicatorStatsRow[];
  const indicatorsWithDestinationValue = scopeIndicators.filter(
    (indicator) => indicator.destination_value !== undefined,
  ).length;

  return (
    <ScopeDetailLayout
      evaluationId={evaluationId}
      scopeName={getScopeName(scope?.acronym, locale, scope?.name ?? 'Cargando...')}
      scopeAcronym={scope?.acronym}
      scopeIcon={scope?.icon}
      evaluationName={evaluation?.name}
      scopeCode={scope?.acronym}
      scopeEje={scope?.axis}
      scopeSortOrder={scope?.sort_order}
      totalIndicators={scopeProgress?.total_indicators ?? 0}
      completedIndicators={scopeProgress?.completed_indicators ?? 0}
      indicatorsWithDestinationValue={indicatorsWithDestinationValue}
      totalRequirements={requirements?.length ?? 0}
      linkedActionsCount={scopeActions?.length ?? 0}
    >
      <IndicatorTable evaluationId={evaluationId} scopeId={scopeId} evaluationStatus={evaluation?.status} />
    </ScopeDetailLayout>
  );
}
