'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDestino } from '@/context/destino-context';
import { getUserRoles } from '@/lib/auth';
import type { EvalFilters } from '@/components/molecules/EvalFilters';

const EVAL_TYPE_VALUES = [
  'autodiagnostico',
  'diagnostico',
  'auditoria',
  'medicion_espontanea',
] as const;

const EVAL_STATUS_VALUES = [
  'borrador',
  'en_curso',
  'carga_finalizada',
  'en_evaluacion',
  'cerrada',
  'anulada',
] as const;

const ADMIN_ROLES = ['admin', 'superadmin'];

interface FilterBarProps {
  onFiltersChange: (filters: EvalFilters) => void;
  showDestination?: boolean;
  filters?: EvalFilters;
  onSearch?: (search: string) => void;
  searchValue?: string;
}

export function FilterBar({
  onFiltersChange,
  showDestination = true,
  filters = {},
  onSearch,
  searchValue = '',
}: FilterBarProps) {
  const { activeDestino, setActiveDestino } = useDestino();
  const userRoles = getUserRoles();
  const isAdmin = ADMIN_ROLES.some((r) => userRoles.includes(r));
  const dt = useTranslations('display-names');
  const t = useTranslations('evaluation');

  const showDestinoPill = showDestination && isAdmin && activeDestino;

  const handleDestinoChipClear = () => {
    setActiveDestino(null);
    onFiltersChange({ ...filters, destinationId: '' });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Destino chip — admin only */}
      {showDestinoPill && (
        <div className="border border-zinc-200 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white flex items-center gap-2">
          <span>{activeDestino.name}</span>
          <button
            onClick={handleDestinoChipClear}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label={t('filters.clear-destination')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tipo select */}
      <Select
        value={filters.type || 'all'}
        onValueChange={(v) =>
          onFiltersChange({ ...filters, type: v === 'all' ? '' : v })
        }
      >
        <SelectTrigger className="w-44 h-9 text-sm">
          <SelectValue placeholder={t('filters.type-placeholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filters.all-types')}</SelectItem>
          {EVAL_TYPE_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {dt(`eval-type.${value}` as any)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Estado select */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(v) =>
          onFiltersChange({ ...filters, status: v === 'all' ? '' : v })
        }
      >
        <SelectTrigger className="w-44 h-9 text-sm">
          <SelectValue placeholder={t('filters.status-placeholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filters.all-statuses')}</SelectItem>
          {EVAL_STATUS_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {dt(`eval-status.${value}` as any)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search input */}
      {onSearch !== undefined && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none w-3.5 h-3.5" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t('filters.search-placeholder')}
            className="border border-zinc-200 rounded-[9px] px-3 py-2 pl-8 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white w-56"
          />
        </div>
      )}
    </div>
  );
}
