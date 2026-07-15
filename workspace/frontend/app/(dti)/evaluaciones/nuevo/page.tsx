'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { EvalForm } from '@/components/organisms/EvalForm';
import { NuevaEvalHelperAside } from '@/components/organisms/NuevaEvalHelperAside';
import { useDestino } from '@/context/destino-context';

export default function NewEvaluationPage() {
  const router = useRouter();
  const { activeDestino } = useDestino();
  const pt = useTranslations('page.evaluaciones');

  const handleSuccess = (id: string) => {
    router.push(`/evaluaciones/${id}`);
  };

  const destinoName = activeDestino?.name || pt('new.selected-destination');

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/evaluaciones">{pt('title')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pt('new.title')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{pt('new.title')}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {pt('new.description', { destination: destinoName })}
        </p>
      </div>

      {/* 2-column grid */}
      <div className="xl:grid xl:grid-cols-[1fr_320px] xl:gap-6 space-y-6 xl:space-y-0">
        {/* Left: form */}
        <div className="border border-zinc-200 rounded-[14px] overflow-hidden bg-white">
          <div className="p-6">
            <EvalForm mode="create" onSuccess={handleSuccess} />
          </div>
        </div>

        {/* Right: aside — hidden below xl */}
        <div className="hidden xl:block">
          <NuevaEvalHelperAside destino={activeDestino} />
        </div>
      </div>
    </div>
  );
}
