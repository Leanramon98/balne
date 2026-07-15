'use client';

import React from 'react';
import { FilterBar } from '@/components/molecules/FilterBar';

export interface EvalFilters {
  destinationId?: string;
  type?: string;
  status?: string;
}

interface EvalFiltersProps {
  onFiltersChange: (filters: EvalFilters) => void;
  showDestination?: boolean;
  filters?: EvalFilters;
}

export function EvalFilters({
  onFiltersChange,
  showDestination = true,
  filters = {},
}: EvalFiltersProps) {
  return (
    <FilterBar
      onFiltersChange={onFiltersChange}
      showDestination={showDestination}
      filters={filters}
    />
  );
}
