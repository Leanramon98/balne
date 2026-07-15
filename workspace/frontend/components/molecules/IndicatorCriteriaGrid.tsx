'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChevronDown, ClipboardCheck } from 'lucide-react';
import { GRADIENT_LABELS } from '@/lib/display-names';
import type { IndicatorCriteria } from '@/types';

const GRADIENT_COLOR_STYLES = [
  'border-red-200 bg-red-50 text-red-900',
  'border-orange-200 bg-orange-50 text-orange-900',
  'border-amber-200 bg-amber-50 text-amber-900',
  'border-lime-200 bg-lime-50 text-lime-900',
  'border-emerald-200 bg-emerald-50 text-emerald-900',
] as const;

const GRADIENT_DOT_STYLES = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
] as const;

interface IndicatorCriteriaGridProps {
  criteria: IndicatorCriteria[];
  currentValue: number;
  evaluatorValue?: number | null;
  indicatorType: 'gradient' | 'boolean' | string;
}

interface ScrollHintTextProps {
  children: ReactNode;
  className: string;
}

function ScrollHintText({ children, className }: ScrollHintTextProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const updateScrollHint = () => {
      setCanScrollDown(element.scrollTop + element.clientHeight < element.scrollHeight - 1);
    };

    updateScrollHint();

    const resizeObserver = new ResizeObserver(updateScrollHint);
    resizeObserver.observe(element);
    element.addEventListener('scroll', updateScrollHint);

    return () => {
      resizeObserver.disconnect();
      element.removeEventListener('scroll', updateScrollHint);
    };
  }, [children]);

  return (
    <div className="relative">
      <div ref={scrollRef} className={className}>
        {children}
      </div>
      {canScrollDown && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-white/90 via-white/70 to-transparent pb-0.5 pt-4">
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/**
 * Description card with requirement info, indicator description,
 * and a criteria grid rendered as gradient columns or boolean options.
 */
export function IndicatorCriteriaGrid({
  criteria,
  currentValue,
  evaluatorValue,
  indicatorType,
}: IndicatorCriteriaGridProps) {
  const isGradient = indicatorType === 'gradient';
  const isBoolean = indicatorType === 'boolean';
  const isSuma = indicatorType === 'suma';

  const getCriteriaDescription = (level: number): string => {
    const c = criteria.find((cr) => cr.level === level || cr.value === level);
    return c?.description ?? '';
  };

  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-zinc-950">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              Criterios de evaluación
            </CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              Escala de referencia · se resalta según los valores cargados
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Destino
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
              Evaluador
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Criteria grid */}
        <div>
          {isGradient ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              {GRADIENT_LABELS.map((label, i) => {
                const level = parseInt(label);
                const isDestinationActive = currentValue === level;
                const isEvaluatorActive = evaluatorValue === level;
                const desc = getCriteriaDescription(level);
                return (
                  <div
                    key={label}
                    className={`relative min-h-36 rounded-2xl border p-4 transition-all ${GRADIENT_COLOR_STYLES[i]} ${
                      isDestinationActive || isEvaluatorActive
                        ? 'shadow-md ring-2 ring-blue-200'
                        : 'shadow-sm'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <div className={`mb-2 h-2 w-10 rounded-full ${GRADIENT_DOT_STYLES[i]}`} />
                        <div className="text-2xl font-bold">{label}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isDestinationActive && (
                          <Badge className="bg-blue-600 text-[10px] hover:bg-blue-600">
                            Destino
                          </Badge>
                        )}
                        {isEvaluatorActive && (
                          <Badge className="bg-purple-600 text-[10px] hover:bg-purple-600">
                            Evaluador
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ScrollHintText className="max-h-24 overflow-y-auto pr-1 text-xs leading-relaxed text-zinc-700">
                      {desc || '—'}
                    </ScrollHintText>
                  </div>
                );
              })}
            </div>
          ) : isBoolean ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 0, label: 'No', desc: getCriteriaDescription(0) },
                { value: 1, label: 'Sí', desc: getCriteriaDescription(1) },
              ].map((opt) => {
                const isDestinationActive = currentValue === opt.value;
                const isEvaluatorActive = evaluatorValue === opt.value;
                return (
                  <div
                    key={opt.label}
                    className={`rounded-2xl border p-4 text-center transition-colors ${
                      isDestinationActive || isEvaluatorActive
                        ? 'ring-2 ring-primary border-primary bg-primary/5'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="text-lg font-bold">{opt.label}</div>
                    <ScrollHintText className="mt-1 max-h-20 overflow-y-auto pr-1 text-xs text-gray-500">
                      {opt.desc || '—'}
                    </ScrollHintText>
                    <div className="mt-2 flex justify-center gap-1">
                      {isDestinationActive && <Badge className="bg-blue-600 text-[10px]">Destino</Badge>}
                      {isEvaluatorActive && <Badge className="bg-purple-600 text-[10px]">Evaluador</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : isSuma ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">
                Cada ítem cumplido aporta su porcentaje. El puntaje total es la suma de los ítems alcanzados.
              </p>

              {/* Accumulated bar */}
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                {criteria.map((c, idx) => {
                  const pct = c.value ?? 0;
                  if (pct === 0) return null; // skip "none" items in bar
                  const colors = ['bg-[#040927]', 'bg-[#1a2566]', 'bg-[#2d3a8c]', 'bg-[#3f4fb3]', 'bg-[#6574d9]'];
                  return (
                    <div
                      key={idx}
                      className={`h-full transition-all ${colors[idx % colors.length]}`}
                      style={{ width: `${pct}%` }}
                      title={`${c.description}: ${pct}%`}
                    />
                  );
                })}
              </div>

              {/* Criteria list (informational, shows all items) */}
              <div className="space-y-2">
                {criteria.map((c, idx) => {
                  const pct = c.value ?? 0;
                  const isNone = pct === 0;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                        isNone
                          ? 'border-zinc-200 bg-zinc-50'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className={`flex h-10 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${
                        isNone ? 'bg-zinc-400' : 'bg-[#040927]'
                      }`}>
                        {pct}%
                      </div>
                      <div className="min-w-0 flex-1">
                        <ScrollHintText className={`max-h-20 overflow-y-auto pr-1 text-sm leading-relaxed ${isNone ? 'text-zinc-400' : 'text-zinc-700'}`}>
                          {c.description || `Criterio ${idx + 1}`}
                        </ScrollHintText>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">
                Tipo de indicador: <span className="font-medium text-zinc-700 capitalize">{indicatorType}</span>
              </p>
              {criteria.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {criteria.map((c, idx) => {
                    const isDestinationActive = currentValue === (c.level ?? c.value);
                    const isEvaluatorActive = evaluatorValue === (c.level ?? c.value);
                    return (
                      <div
                        key={c.level ?? c.value ?? idx}
                        className={`rounded-xl border p-3 transition-colors ${
                          isDestinationActive || isEvaluatorActive
                            ? 'ring-2 ring-blue-200 border-blue-300 bg-blue-50'
                            : 'border-zinc-200 bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-semibold text-zinc-500">
                              {(c.level ?? c.value) != null ? `Nivel ${c.level ?? c.value}` : `Criterio ${idx + 1}`}
                            </span>
                            <ScrollHintText className="mt-1 max-h-20 overflow-y-auto pr-1 text-sm text-zinc-700">
                              {c.description || '—'}
                            </ScrollHintText>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {isDestinationActive && (
                              <Badge className="bg-blue-600 text-[10px] hover:bg-blue-600">
                                Destino
                              </Badge>
                            )}
                            {isEvaluatorActive && (
                              <Badge className="bg-purple-600 text-[10px] hover:bg-purple-600">
                                Evaluador
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 text-center py-4">Sin criterios definidos</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
