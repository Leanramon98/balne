'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProgressWithLabel } from '@/components/atoms/ProgressWithLabel';
import { Target } from 'lucide-react';

interface DestinationViewCardProps {
  indicatorType: 'gradient' | 'boolean' | string;
  destValue: string;
  meta: string;
  metaDate: string;
  currentNumeric: number;
  metaNumeric: number;
  destObs: string;
  isGradient?: boolean;
  /** When true, shows an amber banner indicating the value was promoted from a previous evaluation */
  isPromoted?: boolean;
  /** Override display value for the promoted banner (falls back to destValue) */
  promotedValue?: string;
}

/**
 * Read-only destination value card for IndicatorView.
 * Displays the current destination value, meta, progress, and observations
 * with no editable inputs or save buttons.
 */
export function DestinationViewCard({
  indicatorType,
  destValue,
  meta,
  metaDate,
  currentNumeric,
  metaNumeric,
  destObs,
  isGradient,
  isPromoted = false,
  promotedValue,
}: DestinationViewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500" />
          Valor — Destino
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Valor actual
          </label>
          <p className="rounded-md border bg-gray-50 px-3 py-2 text-sm">
            {destValue}
          </p>
        </div>

        {/* Promoted value indicator */}
        {isPromoted && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-xs font-medium text-amber-700">
              Valor proveniente de evaluación anterior
            </p>
            <p className="text-sm text-amber-600 mt-1">
              {(promotedValue ?? destValue) || 'Sin valor'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Meta (Plan de Transformación)
            </label>
            <p className="rounded-md border bg-gray-50 px-3 py-2 text-sm">
              {meta || '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Fecha meta
            </label>
            <p className="rounded-md border bg-gray-50 px-3 py-2 text-sm">
              {metaDate || '-'}
            </p>
          </div>
        </div>

        {metaNumeric > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">
              Progreso hacia la meta
            </p>
            <ProgressWithLabel
              value={currentNumeric}
              max={metaNumeric}
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-1 block">
            Observaciones del destino
          </label>
          <p className="rounded-md border bg-gray-50 px-3 py-2 text-sm">
            {destObs || 'Sin observaciones'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
