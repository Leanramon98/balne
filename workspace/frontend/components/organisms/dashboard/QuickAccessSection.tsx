'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ClipboardList,
  Zap,
  Map,
  TrendingUp,
} from 'lucide-react';
import { QuickAccessCard } from '@/components/atoms/QuickAccessCard';
import { FadeIn } from '@/components/atoms/FadeIn';

const QUICK_ACCESS_ITEMS = [
  {
    href: '/evaluaciones',
    labelKey: 'evaluations.label',
    icon: ClipboardList,
    descriptionKey: 'evaluations.description',
  },
  {
    href: '/acciones',
    labelKey: 'actions.label',
    icon: Zap,
    descriptionKey: 'actions.description',
  },
  {
    href: '/plan-transformacion',
    labelKey: 'plan.label',
    icon: Map,
    descriptionKey: 'plan.description',
  },
  {
    href: '/resultados',
    labelKey: 'results.label',
    icon: TrendingUp,
    descriptionKey: 'results.description',
  },
];

export function QuickAccessSection() {
  const t = useTranslations('page.inicio.quick-access');

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
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
      {QUICK_ACCESS_ITEMS.map((item, index) => (
        <FadeIn key={item.href} delay={index * 0.1}>
          <QuickAccessCard
            href={item.href}
            label={t(item.labelKey)}
            icon={item.icon}
            description={t(item.descriptionKey)}
          />
        </FadeIn>
      ))}
    </motion.div>
  );
}
