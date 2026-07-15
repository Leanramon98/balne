'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { ActionStatus, AxisLevel, Scope } from '@/types';

const ALL_FILTER_VALUE = 'all' as const;
const EMPTY_STATUS_FILTER = '' as const;

export type ActionStatusFilter = ActionStatus | typeof EMPTY_STATUS_FILTER;

const ACTION_STATUS_OPTIONS = {
  IDEA: 'idea',
  PLANNING: 'en_planificacion',
  EXECUTION: 'en_ejecucion',
  DONE: 'finalizada',
  DISCARDED: 'descartada',
} as const satisfies Record<string, ActionStatus>;

const INTERNAL_HORIZON_OPTIONS = [
  { key: 'corto', value: 'Corto plazo' },
  { key: 'medio', value: 'Medio plazo' },
  { key: 'largo', value: 'Largo plazo' },
];

export interface ActionFiltersProps {
  filterAxes: string[];
  setFilterAxes: Dispatch<SetStateAction<string[]>>;
  filterScopes: string[];
  setFilterScopes: Dispatch<SetStateAction<string[]>>;
  filterIndicator: string;
  setFilterIndicator: Dispatch<SetStateAction<string>>;
  filterStatus: ActionStatusFilter;
  setFilterStatus: Dispatch<SetStateAction<ActionStatusFilter>>;
  filterResponsable: string;
  setFilterResponsable: Dispatch<SetStateAction<string>>;
  filterHorizon: string;
  setFilterHorizon: Dispatch<SetStateAction<string>>;
  axesList: AxisLevel[];
  scopesList: Scope[];
  responsables: string[];
}

export function ActionFilters({
  filterAxes,
  setFilterAxes,
  filterScopes,
  setFilterScopes,
  filterIndicator,
  setFilterIndicator,
  filterStatus,
  setFilterStatus,
  filterResponsable,
  setFilterResponsable,
  filterHorizon,
  setFilterHorizon,
  axesList,
  scopesList,
  responsables,
}: ActionFiltersProps) {
  const t = useTranslations('page.plan');
  const actionStatus = useTranslations('display-names.action-status');

  const handleAxisChange = (value: string) => {
    setFilterAxes(value === ALL_FILTER_VALUE ? [] : [value]);
  };

  const handleScopeChange = (value: string) => {
    setFilterScopes(value === ALL_FILTER_VALUE ? [] : [value]);
  };

  const handleStatusChange = (value: string) => {
    setFilterStatus(value === ALL_FILTER_VALUE ? EMPTY_STATUS_FILTER : value as ActionStatus);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{t('filters.title')}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {/* Eje filter */}
          <div className="space-y-1">
            <Label className="text-xs">{t('filters.axis')}</Label>
            <Select value={filterAxes[0] ?? ALL_FILTER_VALUE} onValueChange={handleAxisChange}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder={t('filters.all-axes')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>{t('filters.all-axes')}</SelectItem>
                {(axesList || []).map((ax) => (
                  <SelectItem
                    key={ax.axis}
                    value={ax.axis}
                  >
                    {ax.axis.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ámbito filter */}
          <div className="space-y-1">
            <Label className="text-xs">{t('filters.scope')}</Label>
            <Select value={filterScopes[0] ?? ALL_FILTER_VALUE} onValueChange={handleScopeChange}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder={t('filters.all-scopes')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>{t('filters.all-scopes')}</SelectItem>
                {(scopesList || []).map((sc) => (
                  <SelectItem
                    key={sc.acronym}
                    value={sc.acronym}
                  >
                    {sc.acronym}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="space-y-1">
            <Label className="text-xs">{t('filters.status')}</Label>
            <Select value={filterStatus || ALL_FILTER_VALUE} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder={t('filters.all-statuses')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>{t('filters.all-statuses')}</SelectItem>
                {Object.values(ACTION_STATUS_OPTIONS).map((status) => (
                  <SelectItem key={status} value={status}>{actionStatus(status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsable */}
          <div className="space-y-1">
            <Label className="text-xs">{t('filters.responsable')}</Label>
            <Select value={filterResponsable || ALL_FILTER_VALUE} onValueChange={setFilterResponsable}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder={t('filters.all-responsables')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>{t('filters.all-responsables')}</SelectItem>
                {responsables.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Horizonte temporal */}
          <div className="space-y-1">
            <Label className="text-xs">{t('filters.horizon')}</Label>
            <Select value={filterHorizon || ALL_FILTER_VALUE} onValueChange={setFilterHorizon}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder={t('filters.all-horizons')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>{t('filters.all-horizons')}</SelectItem>
                {INTERNAL_HORIZON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.key} value={opt.value}>{t(`horizon.${opt.key}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Indicador search */}
          <div className="space-y-1">
            <Label className="text-xs">{t('filters.indicator')}</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                value={filterIndicator}
                onChange={(e) => setFilterIndicator(e.target.value)}
                placeholder={t('filters.indicator-placeholder')}
                className="pl-7 h-8 w-44 text-xs"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
