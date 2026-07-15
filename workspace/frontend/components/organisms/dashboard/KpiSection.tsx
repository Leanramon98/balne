'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ClipboardList, Zap, BarChart3, TrendingUp } from 'lucide-react';
import { KpiCard } from '@/components/atoms/KpiCard';
import { FadeIn } from '@/components/atoms/FadeIn';
import type { DashboardKpis } from '@/sdk/hooks/useDashboardData';

interface KpiSectionProps {
  kpis: DashboardKpis;
  isLoading: boolean;
}

export function KpiSection({ kpis, isLoading }: KpiSectionProps) {
  const t = useTranslations('page.inicio.kpis');

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      <FadeIn delay={0}>
        <KpiCard
          value={kpis.activeEvaluations}
          label={t('active-evaluations')}
          icon={ClipboardList}
          isLoading={isLoading}
        />
      </FadeIn>
      <FadeIn delay={0.1}>
        <KpiCard
          value={kpis.pendingActions}
          label={t('pending-actions')}
          icon={Zap}
          isLoading={isLoading}
        />
      </FadeIn>
      <FadeIn delay={0.2}>
        <KpiCard
          value={kpis.pendingIndicators}
          label={t('pending-indicators')}
          icon={BarChart3}
          isLoading={isLoading}
        />
      </FadeIn>
      <FadeIn delay={0.3}>
        <KpiCard
          value={kpis.globalProgress}
          label={t('global-progress')}
          icon={TrendingUp}
          isLoading={isLoading}
        />
      </FadeIn>
    </motion.div>
  );
}
