'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { AmbitoHeaderCard } from '@/components/organisms/AmbitoHeaderCard';
import { ScopeIcon } from '@/components/atoms/ScopeIcon';

interface ScopeDetailLayoutProps {
  evaluationId: string;
  scopeName: string;
  scopeAcronym?: string;
  scopeIcon?: string;
  evaluationName?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  /** AmbitoHeaderCard props (optional — displayed only when code+eje are provided) */
  scopeCode?: string;
  scopeEje?: string;
  scopeSortOrder?: number;
  totalRequirements?: number;
  totalIndicators?: number;
  completedIndicators?: number;
  indicatorsWithDestinationValue?: number;
  linkedActionsCount?: number;
}

/**
 * Layout template for the scope detail / indicators page.
 * Provides breadcrumb, AmbitoHeaderCard header, optional toolbar, and main content slot.
 */
export function ScopeDetailLayout({
  evaluationId,
  scopeName,
  scopeAcronym,
  scopeIcon,
  evaluationName,
  toolbar,
  children,
  className,
  scopeCode,
  scopeEje,
  scopeSortOrder,
  totalRequirements,
  totalIndicators,
  completedIndicators,
  indicatorsWithDestinationValue,
  linkedActionsCount,
}: ScopeDetailLayoutProps) {
  const bt = useTranslations('breadcrumb');
  const ct = useTranslations('common');
  const t = useTranslations('evaluation');
  const displayCode = scopeCode ?? scopeAcronym ?? '?';
  const showHeaderCard = !!(scopeCode ?? scopeAcronym);

  return (
    <div className={cn('px-6 py-6 space-y-6', className)}>
      {/* Breadcrumb */}
      <Breadcrumb>
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
            <Link
              href={`/evaluaciones/${evaluationId}`}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              {evaluationName ?? ct('loading')}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm text-zinc-500">{t('scope.breadcrumb')}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm font-medium text-zinc-900">{scopeName}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back button */}
      <div className="flex items-center gap-4">
        <Link href={`/evaluaciones/${evaluationId}`}>
          <Button
            variant="ghost"
            size="icon"
            className="border border-zinc-200 rounded-[9px]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* AmbitoHeaderCard (when code is available) */}
      {showHeaderCard ? (
        <AmbitoHeaderCard
          code={displayCode}
          name={scopeName}
          eje={scopeEje ?? ''}
          icon={scopeIcon}
          totalRequirements={totalRequirements}
          totalIndicators={totalIndicators}
          completedIndicators={completedIndicators}
          indicatorsWithDestinationValue={indicatorsWithDestinationValue}
          linkedActionsCount={linkedActionsCount}
        />
      ) : (
        <div>
          <p className="text-sm text-zinc-500">
            {evaluationName ? `Evaluación: ${evaluationName}` : ct('loading')}
          </p>
          <div className="flex items-center gap-3">
            <ScopeIcon icon={scopeIcon} acronym={scopeAcronym} size="md" />
            <h1 className="text-2xl font-bold">
              {scopeAcronym ? `${scopeAcronym} — ` : ''}{scopeName}
            </h1>
          </div>
        </div>
      )}

      {/* Toolbar slot — inline, no Card wrapper */}
      {toolbar && (
        <div className="flex items-center gap-3 flex-wrap py-4">
          {toolbar}
        </div>
      )}

      {/* Main content slot */}
      {children}
    </div>
  );
}
