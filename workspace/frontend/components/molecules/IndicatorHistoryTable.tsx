'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { History } from 'lucide-react';

interface HistoryEntry {
  id?: string;
  source?: string;
  previous_evaluation_id?: string;
  destination_value?: number | null;
  evaluator_value?: number | null;
  destination_observations?: string | null;
  evaluator_observations?: string | null;
  observations?: string | null;
  meta?: number | null;
  modified_by?: string;
  created_at?: string;
}

interface IndicatorHistoryTableProps {
  history?: HistoryEntry[];
}

/**
 * Table that displays the historical values of an indicator across evaluations.
 * Shows evaluation source, value, observations, and date for each entry.
 */
export function IndicatorHistoryTable({
  history,
}: IndicatorHistoryTableProps) {
  const locale = useLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          Historial
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history && history.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Usuario</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Valor</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Meta</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Observaciones</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h, i) => {
                  const value = h.source === 'manual'
                    ? h.destination_value
                    : h.evaluator_value;
                  return (
                <TableRow key={h.id || i}>
                  <TableCell className="text-sm">
                    {h.modified_by || h.source || '-'}
                  </TableCell>
                  <TableCell>{value ?? '-'}</TableCell>
                  <TableCell>{h.meta ?? '-'}</TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                    {h.observations || '-'}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    {h.created_at ? new Date(h.created_at).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </TableCell>
                </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-gray-500">Sin historial disponible.</p>
        )}
      </CardContent>
    </Card>
  );
}
