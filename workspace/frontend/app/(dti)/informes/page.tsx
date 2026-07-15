'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Share2 } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useInformes } from '@/sdk/hooks/useInformes';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const TABLE_HEADER_CLASS = 'bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200';

export default function InformesPage() {
  const router = useRouter();
  const t = useTranslations('page.informes');
  const bt = useTranslations('breadcrumb');
  const ct = useTranslations('common');
  const { informes, isLoading, error } = useInformes();

  const handleShare = async (id: string) => {
    const url = `${window.location.origin}/informes/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('toast.copy-success'));
    } catch {
      toast.error(t('toast.copy-error'));
    }
  };

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
            <BreadcrumbPage className="text-zinc-500 text-sm">{bt('evaluar')}</BreadcrumbPage>
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
        <Button className="w-full sm:w-auto" onClick={() => toast.info(t('toast.generate-soon'))}>{t('generate-button')}</Button>
      </div>

      {/* Table — matching evaluaciones pattern */}
      {isLoading ? (
        <div className="border border-zinc-200 rounded-[12px] overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={TABLE_HEADER_CLASS}>{t('table.name')}</TableHead>
                <TableHead className={TABLE_HEADER_CLASS}>{t('table.year')}</TableHead>
                <TableHead className={TABLE_HEADER_CLASS}>{t('table.destination')}</TableHead>
                <TableHead className={TABLE_HEADER_CLASS}>{t('table.date')}</TableHead>
                <TableHead className={`${TABLE_HEADER_CLASS} w-28 text-center`}>{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : error ? (
        <div className="border border-zinc-200 rounded-[12px] p-6 text-red-500">{ct('error')}: {error.message}</div>
      ) : informes && informes.length > 0 ? (
        <div className="border border-zinc-200 rounded-[12px] overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={TABLE_HEADER_CLASS}>{t('table.name')}</TableHead>
                <TableHead className={TABLE_HEADER_CLASS}>{t('table.year')}</TableHead>
                <TableHead className={TABLE_HEADER_CLASS}>{t('table.destination')}</TableHead>
                <TableHead className={TABLE_HEADER_CLASS}>{t('table.date')}</TableHead>
                <TableHead className={`${TABLE_HEADER_CLASS} w-28 text-center`}>{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {informes.map((inf) => (
                <TableRow key={inf.id}>
                  <TableCell className="font-medium">
                    <FileText className="inline h-4 w-4 mr-2 text-blue-500" />
                    {inf.name}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{inf.year}</Badge></TableCell>
                  <TableCell>{inf.destination_name}</TableCell>
                  <TableCell>{new Date(inf.created_at).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        title={t('action.view')}
                        onClick={() => router.push(`/informes/${inf.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        title={t('action.share')}
                        onClick={() => handleShare(inf.id)}
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-[12px] p-6 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>{t('empty-title')}</p>
        </div>
      )}

      {/* Info card */}
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>{t('info-description')}</p>
          <p className="text-sm mt-2">{t('info-coming-soon')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
