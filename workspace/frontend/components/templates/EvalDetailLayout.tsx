'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusPipeline } from '@/components/molecules/StatusPipeline';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft } from 'lucide-react';

export interface TabDefinition {
  id: string;
  label: string;
  content: ReactNode;
}

interface EvalDetailLayoutProps {
  title: string;
  status: string;
  /** Header actions rendered at the far right of the header row */
  headerActions?: ReactNode;
  tabs: TabDefinition[];
  defaultTabId?: string;
  onTabChange?: (tabId: string) => void;
  /** Breadcrumb + subtitle props */
  evaluationName?: string;
  tipoLabel?: string;
  destinoName?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  /** When provided, renders a StatusPipeline below the header */
  evaluationId?: string;
  allowedTransitions?: string[];
  onStatusTransition?: () => void;
}

export function EvalDetailLayout({
  title,
  status,
  headerActions,
  tabs,
  defaultTabId,
  onTabChange,
  evaluationName,
  tipoLabel,
  destinoName,
  fechaDesde,
  fechaHasta,
  evaluationId,
  allowedTransitions,
  onStatusTransition,
}: EvalDetailLayoutProps) {
  const t = useTranslations('evaluation');
  const bt = useTranslations('breadcrumb');
  const fallbackTabId = tabs[0]?.id;
  const initialTabId = tabs.some((tab) => tab.id === defaultTabId) ? defaultTabId : fallbackTabId;
  const [activeTab, setActiveTab] = useState(initialTabId);

  useEffect(() => {
    const nextTabId = tabs.some((tab) => tab.id === defaultTabId) ? defaultTabId : fallbackTabId;
    setActiveTab(nextTabId);
  }, [defaultTabId, fallbackTabId]);

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <span className="text-sm text-zinc-500">{bt('destino')}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href="/evaluaciones" className="text-sm text-zinc-500 hover:text-zinc-700">
              {bt('evaluar')}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm font-medium text-zinc-900">
              {evaluationName ?? title}
            </span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Right column: header + pipeline + tabs */}
        <div className="flex-1 min-w-0 space-y-6 order-1 lg:order-2 w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <Link href="/evaluaciones" className="shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="border border-zinc-200 rounded-[9px]"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
              </div>
              {(tipoLabel || destinoName || fechaDesde || fechaHasta) && (
                <p className="text-sm text-zinc-500 mt-1">
                  {tipoLabel && destinoName
                    ? `${tipoLabel} de ${destinoName}`
                    : tipoLabel ?? destinoName ?? ''}
                  {(fechaDesde || fechaHasta) && (tipoLabel || destinoName) ? ' · ' : ''}
                  {fechaDesde && fechaHasta
                    ? `${fechaDesde} – ${fechaHasta}`
                    : fechaDesde ?? fechaHasta ?? ''}
                </p>
              )}
            </div>
            {/* Actions aligned to the right of the header */}
            {headerActions && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {headerActions}
              </div>
            )}
          </div>

          {/* Status pipeline */}
          {evaluationId && allowedTransitions && onStatusTransition && (
            <div className="w-full py-2">
              <StatusPipeline
                evaluationId={evaluationId}
                currentStatus={status}
                allowedTransitions={allowedTransitions}
                onTransition={onStatusTransition}
              />
              <p className="text-[11px] text-zinc-400 text-left mt-1">
                {t('layout.status-help')}
              </p>
            </div>
          )}

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(nextTabId) => {
              setActiveTab(nextTabId);
              onTabChange?.(nextTabId);
            }}
          >
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
