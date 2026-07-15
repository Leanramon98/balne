'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useGoodPractices } from '@/sdk/hooks/useGoodPractices';
import { getPublicScopes, getPublicDestinations, getPublicSubnationalLevels, getPublicTypologies } from '@/sdk/api/evaluations-api';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getAxisOptions } from '@/lib/display-names';
import { getScopeName } from '@/lib/scope-translations';
import { formatDate } from '@/lib/date-utils';
import { Search, Award, Globe, MapPin, Filter } from 'lucide-react';

const ODS_IDS = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17'];

export default function BuenasPracticasPage() {
  const locale = useLocale();
  const t = useTranslations('page.buenas-practicas');
  const bt = useTranslations('breadcrumb');
  const ot = useTranslations('ods');
  const [search, setSearch] = useState('');
  const [selectedScope, setSelectedScope] = useState('');
  const [selectedAxis, setSelectedAxis] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSubnationalLevel, setSelectedSubnationalLevel] = useState('');
  const [selectedTypology, setSelectedTypology] = useState('');
  const [selectedODS, setSelectedODS] = useState<string[]>([]);

  const { data: scopes } = useSWR('public-scopes', () => getPublicScopes());
  const { data: destinations } = useSWR('public-destinations', () => getPublicDestinations());
  const { data: subnationalLevels } = useSWR('public-subnational-levels', () => getPublicSubnationalLevels());
  const { data: typologies } = useSWR('public-typologies', () => getPublicTypologies());

  const { practices, isLoading, error } = useGoodPractices({
    scope_id: selectedScope || undefined,
    axis: selectedAxis || undefined,
    country: selectedCountry || undefined,
    locale: locale || undefined,
  });

  const filtered = practices.filter((p) => {
    // Search text
    if (search && !p.action_name?.toLowerCase().includes(search.toLowerCase())) return false;

    // ODS filter (client-side since API may not support OD filter yet)
    if (selectedODS.length > 0) {
      // ODS filtering would require backend support; for now,
      // we show all if ODS is selected (prep for future backend filter)
    }

    return true;
  });

  // Unique countries from destinations
  const countries = [...new Set(destinations?.map((d) => d.country).filter(Boolean) || [])].sort();

  const toggleODS = (odsId: string) => {
    setSelectedODS((prev) =>
      prev.includes(odsId)
        ? prev.filter((o) => o !== odsId)
        : [...prev, odsId]
    );
  };

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-zinc-500 text-sm">{bt('destino')}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-zinc-500 text-sm">{bt('planificar')}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium text-zinc-900">{t('title')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('search-placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedScope} onValueChange={setSelectedScope}>
                <SelectTrigger><SelectValue placeholder={t('filter.scope')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all-scopes')}</SelectItem>
                  {scopes?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.acronym} - {getScopeName(s.acronym, locale, s.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedAxis} onValueChange={setSelectedAxis}>
                <SelectTrigger><SelectValue placeholder={t('filter.axis')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all-axes')}</SelectItem>
                  {getAxisOptions(locale).map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* País filter (new) */}
            <div className="w-full sm:w-48">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger><SelectValue placeholder={t('filter.country')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all-countries')}</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Nivel subnacional filter (new) */}
            <div className="w-full sm:w-48">
              <Select value={selectedSubnationalLevel} onValueChange={setSelectedSubnationalLevel}>
                <SelectTrigger><SelectValue placeholder={t('filter.subnational-level')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all-subnational')}</SelectItem>
                  {subnationalLevels?.map((sl) => (
                    <SelectItem key={sl.id} value={sl.id}>{sl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Tipología filter (new) */}
            <div className="w-full sm:w-48">
              <Select value={selectedTypology} onValueChange={setSelectedTypology}>
                <SelectTrigger><SelectValue placeholder={t('filter.typology')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all-typologies')}</SelectItem>
                  {typologies?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* ODS multiselect (new) */}
            <div className="w-full sm:w-64">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Filter className="mr-2 h-4 w-4" />
                    {selectedODS.length === 0
                      ? t('filter.ods')
                      : t('filter.ods-selected', { count: selectedODS.length })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="start">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <p className="text-sm font-medium mb-2">{t('filter.ods-title')}</p>
                    {ODS_IDS.map((odsId) => (
                      <label key={odsId} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox
                          checked={selectedODS.includes(odsId)}
                          onCheckedChange={() => toggleODS(odsId)}
                        />
                        {ot(odsId)}
                      </label>
                    ))}
                    {selectedODS.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs"
                        onClick={() => setSelectedODS([])}
                      >
                        {t('filter.clear-selection')}
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-48 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card><CardContent className="p-6 text-red-500">{t('load-error', { message: error.message })}</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-gray-500">
          <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>{t('empty')}</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.action_id} href={`/buenas-practicas/${p.action_id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Award className="h-5 w-5 text-yellow-500 mt-1 shrink-0" />
                    <h3 className="font-semibold">{p.action_name}</h3>
                  </div>
                  {p.action_summary && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{p.action_summary}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <MapPin className="h-3 w-3" />
                    <span>{p.destination_name}{p.country ? `, ${p.country}` : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.scope_names?.slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                    {p.scope_names && p.scope_names.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{p.scope_names.length - 3}</Badge>
                    )}
                  </div>
                  {p.approved_at && (
                    <p className="text-[10px] text-gray-400 mt-3">
                      {t('approved')} {formatDate(p.approved_at, locale)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
