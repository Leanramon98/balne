'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useEvaluation } from '@/sdk/hooks/useEvaluations';
import { getDestination } from '@/sdk/api/evaluations-api';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EvalForm } from '@/components/organisms/EvalForm';
import { NuevaEvalHelperAside } from '@/components/organisms/NuevaEvalHelperAside';

export default function EditEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const pt = useTranslations('page.evaluaciones');
  const ct = useTranslations('common');

  const { evaluation, isLoading, error } = useEvaluation(id);

  // Fetch destination name separately when the backend doesn't include it
  // Must be BEFORE early returns to respect Rules of Hooks
  const destId = evaluation?.destination_id;
  const { data: fetchedDestination } = useSWR(
    evaluation && destId && !evaluation.destination_name ? `destination/${destId}` : null,
    () => destId ? getDestination(destId) : Promise.reject('no id'),
  );

  const handleSuccess = () => {
    router.push(`/evaluaciones/${id}`);
  };

  if (isLoading) {
    return (
      <div className="px-6 py-6 max-w-[1400px] mx-auto space-y-4">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-14 w-80" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <Alert variant="destructive" className="mx-6 my-6 max-w-[1400px]">
        <AlertDescription>
          Error: {error?.message || ct('error')}
        </AlertDescription>
      </Alert>
    );
  }

  const resolvedDestName = evaluation.destination_name ?? fetchedDestination?.name ?? pt('new.selected-destination');
  const destino = evaluation.destination_name
    ? { id: evaluation.destination_id, name: evaluation.destination_name }
    : fetchedDestination
      ? { id: evaluation.destination_id, name: fetchedDestination.name }
      : null;

  return (
    <div className="px-6 py-6 max-w-[1400px] mx-auto">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/evaluaciones">{pt('title')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pt('edit.title')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{pt('edit.title')}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {pt('edit.description', { destination: resolvedDestName })}
        </p>
      </div>

      <div className="xl:grid xl:grid-cols-[1fr_320px] xl:gap-6 space-y-6 xl:space-y-0">
        <div className="border border-zinc-200 rounded-[14px] overflow-hidden bg-white">
          <div className="p-6">
            <EvalForm
              mode="edit"
              evaluationId={id}
              initialData={evaluation}
              onSuccess={handleSuccess}
            />
          </div>
        </div>

        <div className="hidden xl:block">
          <NuevaEvalHelperAside destino={destino} />
        </div>
      </div>
    </div>
  );
}
