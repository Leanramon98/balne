'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDestino } from '@/context/destino-context';
import { useDashboardData } from '@/sdk/hooks/useDashboardData';
import { KpiSection } from '@/components/organisms/dashboard/KpiSection';
import { QuickAccessSection } from '@/components/organisms/dashboard/QuickAccessSection';
import { WorkSection } from '@/components/organisms/dashboard/WorkSection';
import { FaqSidebar } from '@/components/organisms/dashboard/FaqSidebar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('page.inicio');
  const router = useRouter();
  const { activeDestino, isLoadingDestino } = useDestino();
  const {
    activeEvaluations,
    kpis,
    isLoadingEvaluations,
    isLoadingActions,
    isLoadingProgress,
  } = useDashboardData();

  const isLoadingKpis = isLoadingEvaluations || isLoadingActions || isLoadingProgress;

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
            {activeDestino ? activeDestino.name : t('title')}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isLoadingDestino
              ? t('loading-destino')
              : activeDestino
                ? t('description')
                : t('select-destino')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="w-full sm:w-auto" onClick={() => router.push('/evaluaciones/nuevo')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('nueva-evaluacion')}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 sm:mb-8">
        <KpiSection kpis={kpis} isLoading={isLoadingKpis} />
      </div>

      {/* Quick Access */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-base font-semibold text-zinc-900 mb-3">
          {t('acceso-rapido')}
        </h2>
        <QuickAccessSection />
      </div>

      {/* Main content + sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-8">
          <WorkSection
            evaluations={activeEvaluations}
            isLoading={isLoadingEvaluations}
          />
        </div>

        {/* Right sidebar */}
        <FaqSidebar />
      </div>
    </div>
  );
}
