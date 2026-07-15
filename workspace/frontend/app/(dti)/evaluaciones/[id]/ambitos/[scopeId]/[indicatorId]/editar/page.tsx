'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { IndicatorEditor } from '@/components/organisms/IndicatorEditor';

export default function IndicatorEditPage() {
  const params = useParams();
  const evaluationId = params.id as string;
  const scopeId = params.scopeId as string;
  const indicatorId = params.indicatorId as string;

  return (
    <IndicatorEditor
      evaluationId={evaluationId}
      scopeId={scopeId}
      indicatorId={indicatorId}
    />
  );
}
