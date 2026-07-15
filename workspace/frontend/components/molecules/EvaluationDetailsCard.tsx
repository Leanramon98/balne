'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/date-utils';
import type { Evaluation } from '@/types';

interface EvaluationDetailsCardProps {
  evaluation: Evaluation;
  destinationName: string;
}

function getInitials(name: string | undefined): string {
  if (!name || name.trim().length === 0) return '-';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return `${first}${last}`.toUpperCase();
}

export function EvaluationDetailsCard({ evaluation, destinationName }: EvaluationDetailsCardProps) {
  const dt = useTranslations('display-names');
  const t = useTranslations('evaluation');
  const ct = useTranslations('common');
  const locale = useLocale();
  const createdByName = evaluation.created_by_name?.trim() || '-';

  const fields = [
    { label: t('details.destination'), value: destinationName },
    { label: t('details.type'), value: dt(`eval-type.${evaluation.type}` as any) ?? evaluation.type },
    { label: t('details.status'), value: dt(`eval-status.${evaluation.status}` as any) ?? evaluation.status },
    { label: t('details.start-date'), value: formatDate(evaluation.start_date, locale) },
    { label: t('details.end-date'), value: formatDate(evaluation.end_date, locale) },
    { label: t('details.external-evaluator'), value: evaluation.has_external_evaluator ? ct('yes') : ct('no') },
    {
      label: t('details.created-by'),
      value: createdByName,
      avatar: true,
    },
    { label: t('details.created'), value: formatDate(evaluation.created_at, locale) },
  ];

  return (
    <Card className="border border-zinc-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-zinc-900">{t('details.title')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {fields.map((field, index) => (
          <div key={field.label}>
            <div className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500">{field.label}</p>
                <p className="text-sm font-semibold text-zinc-900 mt-0.5">{field.value}</p>
              </div>
              {field.avatar && (
                <Avatar className="h-7 w-7 bg-blue-600 text-white text-[10px] font-bold shrink-0">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getInitials(createdByName)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            {index < fields.length - 1 && <div className="border-t border-zinc-100" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
