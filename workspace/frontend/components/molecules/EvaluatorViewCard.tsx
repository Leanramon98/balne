'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck } from 'lucide-react';
import { VerificationBadge } from '@/components/molecules/VerificationBadge';

interface EvaluatorViewCardProps {
  indicatorType: 'gradient' | 'boolean' | string;
  evalValue: string;
  evalObs: string;
  isEditingEnabled: boolean;
  isVerified: boolean;
  previousValue?: string | null;
  isGradient?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  userName: string;
}

/**
 * Read-only evaluator value card for IndicatorView.
 * Displays the current evaluator value, previous value, observations,
 * editing enabled badge, and verification badge.
 */
export function EvaluatorViewCard({
  indicatorType,
  evalValue,
  evalObs,
  isEditingEnabled,
  isVerified,
  previousValue,
  isGradient,
  verifiedBy,
  verifiedAt,
  userName,
}: EvaluatorViewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-purple-500" />
          Valor — Evaluador
          {isEditingEnabled && (
            <Badge
              variant="outline"
              className="ml-auto text-xs text-green-600 border-green-300 bg-green-50"
            >
              Edición habilitada
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Valor actual
            </label>
            <p className="rounded-md border bg-gray-50 px-3 py-2 text-sm">
              {evalValue}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Valor de evaluación anterior
            </label>
            <p className="rounded-md border bg-gray-50 px-3 py-2 text-sm">
              {previousValue ?? evalValue}
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Observaciones del evaluador
          </label>
          <p className="rounded-md border bg-gray-50 px-3 py-2 text-sm">
            {evalObs || 'Sin observaciones'}
          </p>
        </div>

        {isVerified && (
          <VerificationBadge
            verifiedBy={verifiedBy}
            verifiedAt={verifiedAt}
            userName={userName}
          />
        )}
      </CardContent>
    </Card>
  );
}
