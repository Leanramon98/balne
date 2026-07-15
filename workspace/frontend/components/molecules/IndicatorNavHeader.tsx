'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

interface IndicatorNavHeaderProps {
  currentIndex: number;
  totalCount: number;
  prevIndicatorId: string | null;
  nextIndicatorId: string | null;
  evaluationId: string;
  scopeId: string;
  indicatorId: string;
  /** 'editor' (default) — prev/next link to /editar, right link is "Ver vista previa"
   *  'view' — prev/next link without /editar, right link is "Editar" with Pencil icon */
  mode?: 'editor' | 'view';
}

/**
 * Navigation bar for indicator detail pages.
 * Renders prev/next buttons, position counter, and a back-to-grid link.
 */
export function IndicatorNavHeader({
  currentIndex,
  totalCount,
  prevIndicatorId,
  nextIndicatorId,
  evaluationId,
  scopeId,
  indicatorId,
  mode = 'editor',
}: IndicatorNavHeaderProps) {
  const router = useRouter();
  const isViewMode = mode === 'view';

  const navBtnClass =
    'border border-zinc-200 bg-white text-zinc-700 text-sm font-medium ' +
    'hover:bg-zinc-50 rounded-[9px] px-3 py-2 flex items-center gap-1.5 ' +
    'transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Back to grid */}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          router.push(`/evaluaciones/${evaluationId}/ambitos/${scopeId}`)
        }
        className="text-sm"
      >
        <LayoutGrid className="mr-1.5 h-4 w-4" />
        Volver a la grilla
      </Button>

      {/* Separator */}
      <span className="hidden sm:inline text-zinc-300 mx-1">|</span>

      {/* prev / counter / next */}
      <div className="flex items-center gap-2">
        <button
          className={navBtnClass}
          disabled={!prevIndicatorId}
          onClick={() => {
            if (prevIndicatorId) {
              router.push(
                isViewMode
                  ? `/evaluaciones/${evaluationId}/ambitos/${scopeId}/${prevIndicatorId}`
                  : `/evaluaciones/${evaluationId}/ambitos/${scopeId}/${prevIndicatorId}/editar`,
              );
            }
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden xs:inline">Anterior</span>
          <span className="xs:hidden">Ant</span>
        </button>

        <span className="text-sm text-zinc-500 font-medium whitespace-nowrap">
          {currentIndex >= 0 ? `${currentIndex + 1} de ${totalCount}` : '-'}
        </span>

        <button
          className={navBtnClass}
          disabled={!nextIndicatorId}
          onClick={() => {
            if (nextIndicatorId) {
              router.push(
                isViewMode
                  ? `/evaluaciones/${evaluationId}/ambitos/${scopeId}/${nextIndicatorId}`
                  : `/evaluaciones/${evaluationId}/ambitos/${scopeId}/${nextIndicatorId}/editar`,
              );
            }
          }}
        >
          <span className="hidden xs:inline">Siguiente</span>
          <span className="xs:hidden">Sig</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
