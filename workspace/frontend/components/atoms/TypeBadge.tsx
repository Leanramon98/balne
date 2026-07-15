'use client';

import { useTranslations } from 'next-intl';

interface TypeBadgeProps {
  type: string;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const t = useTranslations('display-names');
  const label = t(`eval-type.${type}` as any) ?? type;

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-zinc-200 text-zinc-700 bg-white">
      {label}
    </span>
  );
}
