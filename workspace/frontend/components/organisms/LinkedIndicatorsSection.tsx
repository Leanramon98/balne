'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import useSWR from 'swr';
import { getIndicatorName } from '@/lib/indicator-translations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  XCircle,
} from 'lucide-react';
import {
  getAdminIndicators, unlinkIndicatorFromAction,
} from '@/sdk/api/evaluations-api';
import { ACTION_STATUS_OPTIONS } from '@/lib/display-names';
import type { Action, IndicatorLink } from '@/types';

interface LinkedIndicatorsSectionProps {
  action: Action;
  evaluationId: string;
  onRefresh: () => void;
}

export function LinkedIndicatorsSection({
  action,
  evaluationId,
  onRefresh,
}: LinkedIndicatorsSectionProps) {
  const locale = useLocale();
  const t = useTranslations('linked-indicators');

  const { data: allIndicators } = useSWR(
    'indicators-accion',
    () => getAdminIndicators(),
  );

  const linkedIndicators = action.linked_indicators || [];

  const handleUnlink = async (indicatorId: string, evalId: string) => {
    if (!window.confirm(t('confirm-unlink'))) return;
    try {
      await unlinkIndicatorFromAction(action.id, indicatorId, evalId);
      onRefresh();
    } catch {
      alert(t('unlink-error'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.code')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.name')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.status-at-link')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-24 text-center">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedIndicators.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-400 py-6">
                      {t('empty')}
                    </TableCell>
                </TableRow>
              ) : (
                linkedIndicators.map((link: IndicatorLink, idx: number) => {
                  const ind = allIndicators?.find((i) => i.id === link.indicator_id);
                  return (
                    <TableRow key={link.indicator_id || idx}>
                      <TableCell className="font-mono text-xs">
                        {ind?.code || link.indicator_code || '-'}
                      </TableCell>
                      <TableCell>{getIndicatorName(ind?.code, locale, ind?.name || link.indicator_name || '-')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {link.action_status_at_link
                            ? ACTION_STATUS_OPTIONS.find((s) => s.value === link.action_status_at_link)?.label
                              || link.action_status_at_link
                            : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleUnlink(link.indicator_id, link.evaluation_id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {t('unlink')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
