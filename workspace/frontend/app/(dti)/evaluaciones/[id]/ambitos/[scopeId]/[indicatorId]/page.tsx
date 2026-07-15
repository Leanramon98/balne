'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { IndicatorView } from '@/components/organisms/IndicatorView';

export default function IndicatorViewPage() {
  const params = useParams();
  const evaluationId = params.id as string;
  const scopeId = params.scopeId as string;
  const indicatorId = params.indicatorId as string;

  return (
    <IndicatorView
      evaluationId={evaluationId}
      scopeId={scopeId}
      indicatorId={indicatorId}
    />
  );
}
