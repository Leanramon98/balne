'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations, useLocale } from 'next-intl';
import { useEvaluation } from '@/sdk/hooks/useEvaluations';
import { getDestination } from '@/sdk/api/evaluations-api';
import { useDestino } from '@/context/destino-context';
import { EvalDetailLayout } from '@/components/templates/EvalDetailLayout';

import { NotifyDestination } from '@/components/organisms/NotifyDestination';
import { ScopeGrid } from '@/components/organisms/ScopeGrid';
import { AccessPanel } from '@/components/organisms/AccessPanel';
import { ScopeProgressDashboard } from '@/components/molecules/ScopeProgressDashboard';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { TypeBadge } from '@/components/atoms/TypeBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { displayName } from '@/lib/display-names';
import { formatDate } from '@/lib/date-utils';
import { ArrowUp } from 'lucide-react';
import type { EvaluationStatus } from '@/types';

export default function EvaluationDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const tab = searchParams.get('tab') ?? undefined;
  const { setActiveDestino, setActiveEvaluation } = useDestino();
  const dt = useTranslations('display-names');
  const pt = useTranslations('page.evaluaciones');
  const locale = useLocale();

  const { evaluation, isLoading, error, mutate } = useEvaluation(id);

  const destId = evaluation?.destination_id;
  const needsDestFetch = !!destId && !evaluation?.destination_name;
  const { data: fetchedDestination } = useSWR(
    needsDestFetch ? `destination/${destId}` : null,
    () => getDestination(destId!),
  );

  const destinationName = evaluation?.destination_name
    ?? fetchedDestination?.name
    ?? (evaluation ? displayName(evaluation, 'destination_id', 'destination_name') : '-');

  useEffect(() => {
    if (!evaluation) return;

    setActiveDestino({ id: evaluation.destination_id, name: destinationName });
    setActiveEvaluation({
      id: evaluation.id,
      name: evaluation.name,
      destinationId: evaluation.destination_id,
    });
  }, [evaluation, destinationName, setActiveDestino, setActiveEvaluation]);

  if (isLoading) {
    return (
      <div className="px-6 py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6">
        <Alert variant="destructive">
          <AlertDescription>Error: {error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="px-6 py-6">
        <Alert>
          <AlertDescription>{pt('detail.not-found')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const tipoLabel = dt(`eval-type.${evaluation.type}` as any) ?? evaluation.type;

  const fechaDesde = evaluation.start_date
    ? formatDate(evaluation.start_date, locale)
    : undefined;
  const fechaHasta = evaluation.end_date
    ? formatDate(evaluation.end_date, locale)
    : undefined;

  function handleTabChange(nextTabId: string) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (nextTabId === 'ambitos') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', nextTabId);
    }

    const nextQuery = nextParams.toString();
    router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ''}`, { scroll: false });
  }

  const headerActions = (
    <>
      <NotifyDestination evaluationId={id} />
      {evaluation.status === 'cerrada' && (
        <Link href={`/evaluaciones/${id}/promocionar`}>
          <Button size="sm">
            <ArrowUp className="mr-2 h-4 w-4" />
            {pt('detail.promote')}
          </Button>
        </Link>
      )}
      <StatusBadge status={evaluation.status} />
      <TypeBadge type={evaluation.type} />
    </>
  );

  return (
    <EvalDetailLayout
      title={evaluation.name}
      status={evaluation.status}
      tipoLabel={tipoLabel}
      destinoName={destinationName}
      fechaDesde={fechaDesde}
      fechaHasta={fechaHasta}
      evaluationId={id}
      allowedTransitions={(evaluation.allowed_transitions ?? []) as EvaluationStatus[]}
      onStatusTransition={mutate}
      defaultTabId={tab}
      onTabChange={handleTabChange}
      headerActions={headerActions}
      tabs={[
        {
          id: 'ambitos',
          label: pt('detail.tabs.scopes'),
          content: <ScopeGrid evaluationId={id} />,
        },
        {
          id: 'informacion',
          label: pt('detail.tabs.information'),
          content: <ScopeProgressDashboard evaluationId={id} />,
        },
        {
          id: 'accesos',
          label: pt('detail.tabs.access'),
          content: <AccessPanel evaluationId={id} />,
        },
      ]}
    />
  );
}
