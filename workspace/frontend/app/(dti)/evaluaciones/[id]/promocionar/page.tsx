'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useEvaluation } from '@/sdk/hooks/useEvaluations';
import { promoteEvaluation } from '@/sdk/api/evaluations-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { TypeBadge } from '@/components/atoms/TypeBadge';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { toast } from 'sonner';
import { formatDate } from '@/lib/date-utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft, ArrowUp, Check, X } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  autodiagnostico: 'Autodiagnóstico',
  diagnostico: 'Diagnóstico',
  auditoria: 'Auditoría',
  medicion_espontanea: 'Medición Espontánea',
};

const PROMOTABLE_TYPES: Record<string, { target: string; label: string }[]> = {
  autodiagnostico: [{ target: 'diagnostico', label: 'Diagnóstico' }],
  diagnostico: [{ target: 'auditoria', label: 'Auditoría' }],
  auditoria: [],
  medicion_espontanea: [],
};

export default function PromoteEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const pt = useTranslations('page.evaluaciones');
  const dt = useTranslations('display-names');
  const bt = useTranslations('breadcrumb');
  const ct = useTranslations('common');
  const locale = useLocale();

  const { evaluation, isLoading, error } = useEvaluation(id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [promoting, setPromoting] = useState(false);

  if (isLoading) {
    return (
      <div className="px-6 py-6 space-y-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-48 w-full max-w-2xl" />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="px-6 py-6">
        <Alert variant="destructive">
          <AlertDescription>
            Error: {error?.message || 'Evaluación no encontrada'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const promotionOptions = PROMOTABLE_TYPES[evaluation.type] || [];
  const isPromotable = promotionOptions.length > 0 && evaluation.status === 'cerrada';
  const targetType = promotionOptions[0]?.target;

  const handleConfirm = async () => {
    if (!targetType) return;
    setPromoting(true);
    try {
      const result = await promoteEvaluation(id, targetType as any);
      toast.success(
        `Evaluación promovida a ${TYPE_LABELS[targetType] ?? targetType} correctamente`,
      );
      router.push(`/evaluaciones/${result.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Error al promover la evaluación');
    } finally {
      setPromoting(false);
      setConfirmOpen(false);
    }
  };

  const notPromotableContent = (
    <div className="px-6 py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <span className="text-sm text-zinc-500">Destino</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href="/evaluaciones" className="text-sm text-zinc-500 hover:text-zinc-700">
              Evaluaciones
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm font-medium text-zinc-900">Promover Evaluación</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Link href={`/evaluaciones/${id}`}>
          <Button
            variant="ghost"
            size="icon"
            className="border border-zinc-200 rounded-[9px]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Promover Evaluación</h1>
      </div>

      <Alert>
        <AlertDescription>
          {evaluation.status !== 'cerrada'
            ? 'La evaluación debe estar en estado "Cerrada" para poder promoverla.'
            : `Esta evaluación de tipo ${TYPE_LABELS[evaluation.type] ?? evaluation.type} no se puede promover a un tipo superior.`}
        </AlertDescription>
      </Alert>

      <Link href={`/evaluaciones/${id}`}>
        <Button variant="outline">Volver a la evaluación</Button>
      </Link>
    </div>
  );

  if (!isPromotable) return notPromotableContent;

  return (
    <div className="px-6 py-6 space-y-6 max-w-2xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <span className="text-sm text-zinc-500">Destino</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href="/evaluaciones" className="text-sm text-zinc-500 hover:text-zinc-700">
              Evaluaciones
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm font-medium text-zinc-900">Promover Evaluación</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Link href={`/evaluaciones/${id}`}>
          <Button
            variant="ghost"
            size="icon"
            className="border border-zinc-200 rounded-[9px]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Promover Evaluación</h1>
      </div>

      {/* Origin evaluation details */}
      <Card>
        <CardHeader>
          <CardTitle>Origen: {evaluation.name}</CardTitle>
          <CardDescription>
            Se creará una nueva evaluación del tipo destino con los datos copiados
            de la evaluación actual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Tipo actual:</span>{' '}
              <TypeBadge type={evaluation.type} />
            </div>
            <div>
              <span className="font-medium">Estado:</span>{' '}
              <StatusBadge status={evaluation.status} />
            </div>
            <div>
              <span className="font-medium">Tipo destino:</span>{' '}
              <TypeBadge type={targetType} />
            </div>
            <div>
              <span className="font-medium">Fecha desde:</span>{' '}
              {formatDate(evaluation.start_date, locale)}
            </div>
            <div>
              <span className="font-medium">Fecha hasta:</span>{' '}
              {formatDate(evaluation.end_date, locale)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What will be copied */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-green-700">
            <Check className="h-4 w-4" />
            Se copiará
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Valores de indicadores cargados por el destino</li>
            <li>Valores de indicadores cargados por evaluadores</li>
            <li>Observaciones registradas en los indicadores</li>
            <li>Acciones vinculadas a los indicadores</li>
            <li>Historial de cambios de cada indicador</li>
          </ul>
        </CardContent>
      </Card>

      {/* What will NOT be copied */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-amber-700">
            <X className="h-4 w-4" />
            No se copiará
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Mensajes internos de los indicadores</li>
            <li>Análisis de IA generados</li>
            <li>Sugerencias de mejora generadas por IA</li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href={`/evaluaciones/${id}`}>
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={() => setConfirmOpen(true)} disabled={promoting}>
          <ArrowUp className="mr-2 h-4 w-4" />
          {promoting ? 'Promoviendo...' : 'Confirmar Promoción'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Promover evaluación"
        description={`¿Está seguro de promover "${evaluation.name}" a ${TYPE_LABELS[targetType] ?? targetType}? Se creará una nueva evaluación con los datos copiados.`}
        onConfirm={handleConfirm}
        confirmText="Promover"
      />
    </div>
  );
}
