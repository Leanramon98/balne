'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Plus } from 'lucide-react';

interface EvalListLayoutProps {
  filters: ReactNode;
  children: ReactNode;
}

export function EvalListLayout({ filters, children }: EvalListLayoutProps) {
  const bt = useTranslations('breadcrumb');
  const pt = useTranslations('page.evaluaciones');

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
            <BreadcrumbPage className="text-sm font-medium text-zinc-900">{pt('title')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pt('title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{pt('description')}</p>
        </div>
        <Link href="/evaluaciones/nuevo">
          <Button variant="black">
            <Plus className="mr-2 h-4 w-4" />
            {pt('new.title')}
          </Button>
        </Link>
      </div>

      {/* Filter bar — no Card wrapper */}
      <div>{filters}</div>

      {/* Table */}
      <div>{children}</div>
    </div>
  );
}
