'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useActions } from '@/sdk/hooks/useActions';
import { getScopes } from '@/sdk/api/evaluations-api';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
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
import { getAxisLabel, getActionStatusLabel } from '@/lib/display-names';
import { getScopeName } from '@/lib/scope-translations';
import { formatDate } from '@/lib/date-utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useDestino } from '@/context/destino-context';
import { Plus, Eye, Edit, X } from 'lucide-react';

const ACTION_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'warning' | 'success' | 'destructive'> = {
  idea: 'secondary',
  en_planificacion: 'default',
  en_ejecucion: 'warning',
  finalizada: 'success',
  descartada: 'destructive',
};

export default function ActionsPage() {
  const { activeDestino, setActiveDestino, canSelectDestino } = useDestino();
  const locale = useLocale();
  const t = useTranslations('page.acciones');
  const bt = useTranslations('breadcrumb');
  const { data: scopesList } = useSWR('scopes-actions', () => getScopes());

  // Always sync destination from header DestinoPill — matching evaluaciones pattern
  const destinationId = activeDestino?.id;
  const { actions, isLoading, error } = useActions(destinationId);

  // Build id → name lookup for scope display (with translations)
  const scopeNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of scopesList || []) {
      map[s.id] = getScopeName(s.acronym, locale, s.name);
    }
    return map;
  }, [scopesList, locale]);

  // ── Client-side pagination ──
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(actions.length / PAGE_SIZE));
  const paginatedActions = useMemo(
    () => actions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [actions, page],
  );

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  // Reset to page 1 when destination changes
  useEffect(() => { setPage(1); }, [destinationId]);

  // Pagination helper: generate visible page numbers (same as EvalTable pattern)
  const getPageNumbers = useCallback(() => {
    const pages: (number | 'ellipsis')[] = [];
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
  }, [totalPages, page]);

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-zinc-500 text-sm">{bt('destino')}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-zinc-500 text-sm">{bt('planificar')}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium text-zinc-900">{t('title')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title row */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('description')}</p>
        </div>
        <Link href="/acciones/nuevo" className="w-full sm:w-auto">
          <Button variant="black" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('nueva')}
          </Button>
        </Link>
      </div>

      {/* Destination chip — read-only indicator synced with header, matching evaluaciones pattern */}
      {canSelectDestino && activeDestino && (
        <div className="flex items-center gap-2">
          <div className="border border-zinc-200 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white flex items-center gap-2">
            <span>{activeDestino.name}</span>
            <button
              onClick={() => setActiveDestino(null)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
              aria-label={t('clear-destino')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Table — no Card wrapper, matching evaluaciones pattern */}
      {isLoading ? (
        <div className="border border-zinc-200 rounded-[12px] overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.name')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 min-w-[120px]">{t('table.status')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.axes')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.scopes')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.responsible')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.end-date')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-28 text-center">{t('table.actions')}</TableHead>
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
      ) : error ? (
        <div className="border border-zinc-200 rounded-[12px] p-6 text-red-500">{t('error', { message: error.message })}</div>
      ) : actions.length === 0 ? (
        <div className="border border-zinc-200 rounded-[12px] overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.name')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 min-w-[120px]">{t('table.status')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.axes')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.scopes')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.responsible')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.end-date')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-28 text-center">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-zinc-500">
                  {t('empty')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-[12px] overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.name')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 min-w-[120px]">{t('table.status')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.axes')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.scopes')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.responsible')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.end-date')}</TableHead>
                <TableHead className="bg-white text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-28 text-center">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedActions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="font-medium">{action.name}</TableCell>
                  <TableCell>
<Badge variant={ACTION_STATUS_VARIANTS[action.status] || 'default'} className="whitespace-nowrap">
                        {getActionStatusLabel(action.status)}
                      </Badge>
                  </TableCell>
                  <TableCell>{action.axes?.map((code) => getAxisLabel(code)).join(', ') || '-'}</TableCell>
                  <TableCell>{action.scopes?.map((s) => scopeNameMap[s] || s).join(', ') || '-'}</TableCell>
                  <TableCell>{action.responsible_person || '-'}</TableCell>
                  <TableCell>{action.end_date ? formatDate(action.end_date, locale) : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/acciones/${action.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label={t('view-aria', { name: action.name })}
                        title={t('view')}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/acciones/${action.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label={t('edit-aria', { name: action.name })}
                        title={t('edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm text-zinc-500 order-2 sm:order-1">
            {t('pagination', { total: actions.length, page, totalPages })}
          </span>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e) => { e.preventDefault(); goToPage(page - 1); }}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  aria-disabled={page <= 1}
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
                      isActive={p === page}
                      onClick={(e) => { e.preventDefault(); goToPage(p); }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={(e) => { e.preventDefault(); goToPage(page + 1); }}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  aria-disabled={page >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
