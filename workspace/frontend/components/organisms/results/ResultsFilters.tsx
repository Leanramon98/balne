'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { getAxisOptions } from '@/lib/display-names';
import { getScopeName } from '@/lib/scope-translations';
import { useDestino } from '@/context/destino-context';
import { Search, Filter, X } from 'lucide-react';
import { ScopeIcon } from '@/components/atoms/ScopeIcon';

interface Scope {
  id: string;
  acronym: string;
  name: string;
  icon?: string;
  axis?: string;
}

interface NamedItem {
  id: string;
  name: string;
}

export interface ResultsFiltersProps {
  year: string;
  setYear: (value: string) => void;
  selectedScopes: string[];
  setSelectedScopes: (value: string[]) => void;
  selectedAxis: string;
  setSelectedAxis: (value: string) => void;
  selectedTypology: string;
  setSelectedTypology: (value: string) => void;
  selectedMemberType: string;
  setSelectedMemberType: (value: string) => void;
  scopes?: Scope[];
  typologies?: NamedItem[];
  memberTypes?: NamedItem[];
  onSearch: () => void;
}

export default function ResultsFilters({
  year,
  setYear,
  selectedScopes,
  setSelectedScopes,
  selectedAxis,
  setSelectedAxis,
  selectedTypology,
  setSelectedTypology,
  selectedMemberType,
  setSelectedMemberType,
  scopes,
  typologies,
  memberTypes,
  onSearch,
}: ResultsFiltersProps) {
  const locale = useLocale();
  const t = useTranslations('page.resultados.filters');
  const ct = useTranslations('common');
  const { activeDestino, setActiveDestino, canSelectDestino } = useDestino();

  const toggleScope = (scopeId: string) => {
    setSelectedScopes(
      selectedScopes.includes(scopeId)
        ? selectedScopes.filter((s) => s !== scopeId)
        : [...selectedScopes, scopeId]
    );
  };
  return (
    <Card>
      <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="w-32">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => {
                  const y = (new Date().getFullYear() - i).toString();
                  return <SelectItem key={y} value={y}>{y}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Ámbito multiselect inline checkboxes */}
          <div className="w-64">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedScopes.length === 0
                    ? t('all-scopes')
                    : t('n-scopes', { n: selectedScopes.length })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">{t('scopes-label')}</p>
                  {scopes?.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={selectedScopes.includes(s.id)}
                        onCheckedChange={() => toggleScope(s.id)}
                      />
                      <ScopeIcon icon={s.icon} axis={s.axis} acronym={s.acronym} size="sm" />
                      {getScopeName(s.acronym, locale, s.name)}
                    </label>
                  ))}
                  {selectedScopes.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-xs"
                      onClick={() => setSelectedScopes([])}
                    >
                      {t('clear-selection')}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-48">
            <Select value={selectedAxis} onValueChange={setSelectedAxis}>
              <SelectTrigger><SelectValue placeholder={t('axis-placeholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all-axes')}</SelectItem>
                {getAxisOptions(locale).map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipología filter */}
          <div className="w-48">
            <Select value={selectedTypology} onValueChange={setSelectedTypology}>
              <SelectTrigger><SelectValue placeholder={t('typology-placeholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all-typologies')}</SelectItem>
                {typologies?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select value={selectedMemberType} onValueChange={setSelectedMemberType}>
              <SelectTrigger><SelectValue placeholder={t('member-type-placeholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all-member-types')}</SelectItem>
                {memberTypes?.map((mt) => (
                  <SelectItem key={mt.id} value={mt.id}>{mt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Destination chip — synced with header DestinoPill, matching evaluaciones pattern */}
          {canSelectDestino ? (
            activeDestino ? (
            <div className="border border-zinc-200 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white flex items-center gap-2">
              <span>{activeDestino.name}</span>
              <button
                onClick={() => setActiveDestino(null)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label={t('clear-destination')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="border border-zinc-200 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-400 bg-zinc-50">
              {t('no-destination')}
            </div>
          )
          ) : null}
          <Button onClick={onSearch}>
            <Search className="mr-2 h-4 w-4" /> {ct('search')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
