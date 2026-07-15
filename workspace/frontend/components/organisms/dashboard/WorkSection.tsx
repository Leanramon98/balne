'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { WorkItem } from '@/components/atoms/WorkItem';
import { FadeIn } from '@/components/atoms/FadeIn';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';
import type { Evaluation } from '@/types';

interface WorkSectionProps {
  evaluations: Evaluation[];
  isLoading: boolean;
}

export function WorkSection({ evaluations, isLoading }: WorkSectionProps) {
  const t = useTranslations('page.inicio.work');

  return (
    <div className="space-y-3">
      <FadeIn>
        <h2 className="text-base font-semibold text-zinc-900">{t('title')}</h2>
      </FadeIn>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : evaluations.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 p-8 text-center">
            <ClipboardList className="h-8 w-8 text-zinc-300 mb-2" />
            <p className="text-sm font-medium text-zinc-500">
              {t('empty-title')}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {t('empty-description')}
            </p>
          </div>
        </FadeIn>
      ) : (
        <motion.div
          className="space-y-3"
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
          {evaluations.map((evaluation, index) => (
            <FadeIn key={evaluation.id} delay={index * 0.1}>
              <WorkItem evaluation={evaluation} />
            </FadeIn>
          ))}
        </motion.div>
      )}
    </div>
  );
}
