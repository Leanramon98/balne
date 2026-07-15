'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

/** Maps eje key (I, II, III, IV, V or 1-5) to a Tailwind bg class for the dot */
const EJE_DOT_COLOR: Record<string, string> = {
  '1': 'bg-blue-500',
  I: 'bg-blue-500',
  '2': 'bg-purple-500',
  II: 'bg-purple-500',
  '3': 'bg-green-500',
  III: 'bg-green-500',
  '4': 'bg-orange-500',
  IV: 'bg-orange-500',
  '5': 'bg-pink-500',
  V: 'bg-pink-500',
};

function getEjeDotColor(axisKey?: string): string {
  if (!axisKey) return 'bg-zinc-400';
  const upper = axisKey.toUpperCase().trim();
  if (EJE_DOT_COLOR[upper]) return EJE_DOT_COLOR[upper];
  const first = upper.split(/[\s\-_]/)[0];
  return EJE_DOT_COLOR[first] ?? 'bg-zinc-400';
}

interface IndicatorBreadcrumbProps {
  axisName?: string;
  axisKey?: string;
  scopeName?: string;
  requirementCode?: string;
  requirementName?: string;
}

/**
 * Classification bar for indicator context.
 * Shows horizontal breadcrumb: [colored dot] Eje / Ámbito / Requisito
 */
export function IndicatorBreadcrumb({
  axisName,
  axisKey,
  scopeName,
  requirementCode,
  requirementName,
}: IndicatorBreadcrumbProps) {
  const segments: React.ReactNode[] = [];

  if (axisName) {
    const dotColor = getEjeDotColor(axisKey ?? axisName);
    segments.push(
      <span key="axis" className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
        <span className="text-sm text-zinc-500">{axisName}</span>
      </span>,
    );
  }

  if (scopeName) {
    if (segments.length > 0) {
      segments.push(
        <ChevronRight key="sep-scope" className="h-3 w-3 text-zinc-300 flex-shrink-0" />,
      );
    }
    segments.push(
      <span key="scope" className="text-sm text-zinc-500">
        {scopeName}
      </span>,
    );
  }

  if (requirementCode) {
    if (segments.length > 0) {
      segments.push(
        <ChevronRight key="sep-req" className="h-3 w-3 text-zinc-300 flex-shrink-0" />,
      );
    }
    segments.push(
      <span key="req" className="text-sm font-semibold text-zinc-900">
        {requirementCode}
        {requirementName ? ` — ${requirementName}` : ''}
      </span>,
    );
  }

  if (segments.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {segments}
    </div>
  );
}
