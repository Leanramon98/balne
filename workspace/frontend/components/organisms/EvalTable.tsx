'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/atoms/EmptyState';
import { EvalRow } from '@/components/molecules/EvalRow';
import { useEvaluations } from '@/sdk/hooks/useEvaluations';
import {
  deleteEvaluation,
  changeEvaluationStatus,
} from '@/sdk/api/evaluations-api';
import { toast } from 'sonner';
import { ClipboardList, RefreshCw } from 'lucide-react';
import type { EvalFilters } from '@/components/molecules/EvalFilters';
import type { EvaluationStatus } from '@/types';

interface EvalTableProps {
  filters?: EvalFilters;
  destinationId?: string;
}

export function EvalTable({ filters, destinationId }: EvalTableProps) {
  const t = useTranslations('evaluation');
  const effectiveDestId = destinationId || filters?.destinationId;
  const { evaluations, isLoading, error, mutate, total, limit, offset, pagination } = useEvaluations({
    destination_id: effectiveDestId || undefined,
    type: filters?.type as any || undefined,
    status: filters?.status as any || undefined,
  });

  const handleAction = async (action: string, id: string, payload?: unknown) => {
    try {
      switch (action) {
        case 'delete':
          await deleteEvaluation(id);
          toast.success(t('table.delete-success'));
          break;

        case 'anular':
          await changeEvaluationStatus(id, 'anulada');
          toast.success(t('table.void-success'));
          break;

        case 'changeStatus':
          if (payload && typeof payload === 'object' && 'status' in payload) {
            const newStatus = (payload as { status: EvaluationStatus }).status;
            await changeEvaluationStatus(id, newStatus);
            toast.success(t('table.status-success'));
          }
          break;

        default:
          console.warn('Unknown action:', action);
          return;
      }
      await mutate();
    } catch (err: any) {
      const status = err.status || err.statusCode;
      if (status === 422) {
        toast.warning(err.message || t('table.action-error'));
      } else if (status === 403) {
        toast.warning(t('table.forbidden-error'));
      } else {
        toast.error(err.message || t('table.action-error'));
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="border border-zinc-200 rounded-[12px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.name')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.type')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.status')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.start-date')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.end-date')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.created-by')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-28 text-center">{t('table.headers.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-12 w-12" />}
        title={t('table.error-title')}
        description={error.message || t('table.error-description')}
        action={
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" /> {t('table.retry')}
          </Button>
        }
      />
    );
  }

  // Empty state
  if (!evaluations || evaluations.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-12 w-12" />}
        title={t('table.empty-title')}
        description={t('table.empty-description')}
      />
    );
  }

  // Pagination helper: generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const { totalPages, page } = pagination;
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  // Data state
  return (
    <div>
      <div className="border border-zinc-200 rounded-[12px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.name')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.type')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.status')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.start-date')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.end-date')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.headers.created-by')}</TableHead>
              <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-28 text-center">{t('table.headers.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.map((evalItem) => (
              <EvalRow
                key={evalItem.id}
                evaluation={evalItem}
                onAction={handleAction}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            {t('table.pagination', { total, page: pagination.page, totalPages: pagination.totalPages })}
          </div>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e) => { e.preventDefault(); pagination.prevPage(); }}
                  className={!pagination.hasPrev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  aria-disabled={!pagination.hasPrev}
                />
              </PaginationItem>

              {getPageNumbers().map((p, idx) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === pagination.page}
                      onClick={(e) => { e.preventDefault(); pagination.goToPage(p); }}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={(e) => { e.preventDefault(); pagination.nextPage(); }}
                  className={!pagination.hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  aria-disabled={!pagination.hasNext}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
