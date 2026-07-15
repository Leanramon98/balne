'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { EvalTable } from '@/components/organisms/EvalTable';
import { EvalFilters, type EvalFilters as EvalFiltersType } from '@/components/molecules/EvalFilters';
import { EvalListLayout } from '@/components/templates/EvalListLayout';
import { getUserRoles } from '@/lib/auth';
import { useDestino } from '@/context/destino-context';

export default function EvaluationsPage() {
  const { activeDestino } = useDestino();
  const [filters, setFilters] = useState<EvalFiltersType>({
    destinationId: '',
    type: '',
    status: '',
  });

  // Sync activeDestino from header DestinoPill into the filters
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      destinationId: activeDestino?.id ?? '',
    }));
  }, [activeDestino]);

  const userRoles = getUserRoles();
  const showDestination = userRoles.includes('admin') || userRoles.includes('admin_destino');

  const handleFiltersChange = useCallback((newFilters: EvalFiltersType) => {
    setFilters(newFilters);
  }, []);

  return (
    <EvalListLayout
      filters={
        <EvalFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          showDestination={showDestination}
        />
      }
    >
      <EvalTable filters={filters} />
    </EvalListLayout>
  );
}
