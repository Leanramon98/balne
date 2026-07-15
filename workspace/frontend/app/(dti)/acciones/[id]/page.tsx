'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAction } from '@/sdk/hooks/useActions';
import {
  updateAction, getResponsibleAreas,
  designateGoodPractice, approveGoodPractice, rejectGoodPractice,
  getScopes,
} from '@/sdk/api/evaluations-api';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowLeft, Save, Award, CheckCircle, XCircle,
} from 'lucide-react';
import { ScopeIcon } from '@/components/atoms/ScopeIcon';
import {
  ACTION_STATUS_OPTIONS, getAxisOptions,
} from '@/lib/display-names';
import { formatDate, toDateInputValue } from '@/lib/date-utils';
import { getScopeName } from '@/lib/scope-translations';
import { EvidenceSection } from '@/components/organisms/EvidenceSection';
import { LinkedIndicatorsSection } from '@/components/organisms/LinkedIndicatorsSection';
import { useDestino } from '@/context/destino-context';
import { getUserRoles } from '@/lib/auth';
import type { ActionStatus } from '@/types';

const COMPLEXITY_OPTIONS = ['baja', 'media', 'alta'];
const HORIZON_OPTIONS = ['corto', 'medio', 'largo'];
const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'ARS'];

export default function ActionDetailPage() {
  const locale = useLocale();
  const t = useTranslations('page.accion');
  const ct = useTranslations('common');
  const bt = useTranslations('breadcrumb');
  const accionesT = useTranslations('page.acciones');
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNew = id === 'nuevo';
  const isEdit = !isNew;

  const { action, isLoading, error, mutate } = useAction(isEdit ? id : undefined);
  const { activeDestino } = useDestino();
  const { data: areas } = useSWR('areas', () => getResponsibleAreas());
  const { data: scopesList } = useSWR('scopes-accion', () => getScopes());

  // evaluationId comes from query param (used by EvidenceSection & LinkedIndicatorsSection)
  const evaluationId = searchParams.get('evaluation_id') || '';

  const isAdmin = getUserRoles().includes('admin');

  // Form state
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [objective, setObjective] = useState('');
  const [status, setStatus] = useState<ActionStatus>('idea');
  const [selectedAxes, setSelectedAxes] = useState<string[]>([]);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [complexity, setComplexity] = useState('');
  const [horizon, setHorizon] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [responsibleArea, setResponsibleArea] = useState('');
  const [actors, setActors] = useState('');
  const [ods, setOds] = useState<{ ods_id: string; contribution: string }[]>([]);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('EUR');
  const [budgetExecuted, setBudgetExecuted] = useState('');
  const [budgetSource, setBudgetSource] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [awards, setAwards] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Auto-set destination from context in create mode
  React.useEffect(() => {
    if (isNew && activeDestino?.id) {
      setDestinationId(activeDestino.id);
    }
  }, [isNew, activeDestino]);

  // Initialize form from action data
  React.useEffect(() => {
    if (action) {
      setName(action.name || '');
      setSummary(action.summary || '');
      setObjective(action.objective || '');
      setStatus(action.status || 'idea');
      setSelectedAxes(action.axes || []);
      setSelectedScopes(action.scopes || []);
      setComplexity(action.complexity || '');
      setHorizon(action.horizon || '');
      setStartDate(toDateInputValue(action.start_date));
      setEndDate(toDateInputValue(action.end_date));
      setDescription(action.extended_description || '');
      setResponsiblePerson(action.responsible_person || '');
      setResponsibleArea(action.responsible_area_id || '');
      setActors(action.actors || '');
      setOds(action.ods || []);
      setBudgetAmount(action.budget_amount?.toString() || '');
      setBudgetCurrency(action.budget_currency || 'EUR');
      setBudgetExecuted(action.budget_executed?.toString() || '');
      setBudgetSource(action.budget_source || '');
      setWebsiteUrl(action.website_url || '');
      setPhotoUrl(action.photo_url || '');
      setAwards(action.awards || '');
      setDestinationId(action.destination_id || '');
    }
  }, [action]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) { setFormError(t('form.validation.name-required')); return; }

    setSaving(true);
    try {
      const data: any = {
        name: name.trim(),
        summary, objective, status,
        axes: selectedAxes, scopes: selectedScopes,
        complexity: complexity || undefined,
        horizon: horizon || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        extended_description: description,
        responsible_person: responsiblePerson,
        responsible_area_id: responsibleArea || undefined,
        actors, ods,
        budget_amount: budgetAmount ? Number(budgetAmount) : undefined,
        budget_currency: budgetCurrency,
        budget_executed: budgetExecuted ? Number(budgetExecuted) : undefined,
        budget_source: budgetSource,
        website_url: websiteUrl,
        photo_url: photoUrl,
        awards,
      };
      console.log('[action-save] PUT body:', JSON.stringify(data, null, 2));

      if (isNew) {
        const { createAction } = await import('@/sdk/api/evaluations-api');
        if (!destinationId) { setFormError(t('form.validation.destination-required')); setSaving(false); return; }
        data.destination_id = destinationId;
        const result = await createAction(data);
        router.push(`/acciones/${result.id}`);
      } else {
        await updateAction(id, data);
        await mutate();
        alert(t('form.save-success'));
      }
    } catch (err: any) {
      setFormError(err.message || t('form.save-error'));
    } finally {
      setSaving(false);
    }
  };

  // Good Practice handlers
  const handleDesignateGP = async () => {
    try {
      await designateGoodPractice(id);
      await mutate();
    } catch (err) {
      alert(t('form.gp-designate-error'));
    }
  };

  const handleApproveGP = async () => {
    try {
      await approveGoodPractice(id);
      await mutate();
    } catch (err) {
      alert(t('form.gp-approve-error'));
    }
  };

  const handleRejectGP = async () => {
    try {
      await rejectGoodPractice(id);
      await mutate();
    } catch (err) {
      alert(t('form.gp-reject-error'));
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="px-6 py-6 space-y-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isEdit && error) {
    return (
      <div className="px-6 py-6">
        <Alert variant="destructive"><AlertDescription>{ct('error')}: {error.message}</AlertDescription></Alert>
      </div>
    );
  }

  const gp = action?.good_practice;

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
            <Link href="/acciones" className="text-sm text-zinc-500 hover:text-zinc-700">
              {accionesT('title')}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium text-zinc-900">
              {isNew ? t('breadcrumb.new') : action?.name || t('breadcrumb.edit')}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/acciones">
            <Button
              variant="ghost"
              size="icon"
              className="border border-zinc-200 rounded-[9px]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{isNew ? t('title.new') : action?.name || t('title.edit')}</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {isNew ? t('description.new') : t('description.edit')}
            </p>
          </div>
        </div>
        {isEdit && gp && (
          <div className="flex items-center gap-2">
            <Badge variant={gp.status === 'approved' ? 'success' : gp.status === 'rejected' ? 'destructive' : 'warning'}>
              <Award className="mr-1 h-3 w-3" />
              BP: {gp.status === 'approved' ? t('good-practice.approved') : gp.status === 'rejected' ? t('good-practice.rejected') : t('good-practice.designated')}
            </Badge>
          </div>
        )}
      </div>

      {formError && (
        <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>
      )}

      {/* Buena Práctica DTI — full ficha (F4-04) */}
      {isEdit && action && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4" />
              {t('good-practice.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!gp ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">{t('good-practice.not-designated')}</p>
                <Button size="sm" variant="outline" onClick={handleDesignateGP}>
                  <Award className="mr-2 h-4 w-4" /> {t('good-practice.designate')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={gp.status === 'approved' ? 'success' : gp.status === 'rejected' ? 'destructive' : 'warning'}>
                    {gp.status === 'approved' ? t('good-practice.approved') : gp.status === 'rejected' ? t('good-practice.rejected') : t('good-practice.designated')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('good-practice.designated-by')}</span>
                    <p className="font-medium">{gp.designated_by_name || gp.designated_by || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('good-practice.designated-at')}</span>
                    <p className="font-medium">
                      {formatDate(gp.designated_at, locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {gp.status === 'approved' && (
                  <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                    <div>
                      <span className="text-gray-500">{t('good-practice.approved-by')}</span>
                      <p className="font-medium">{gp.approved_by_name || gp.approved_by || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('good-practice.approved-at')}</span>
                      <p className="font-medium">
                        {formatDate(gp.approved_at, locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}

                {gp.status === 'designated' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="default" onClick={handleApproveGP}>
                      <CheckCircle className="mr-2 h-4 w-4" /> {t('good-practice.approve')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleRejectGP}>
                      <XCircle className="mr-2 h-4 w-4" /> {t('good-practice.reject')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basicos">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="basicos">{t('tabs.basicos')}</TabsTrigger>
            <TabsTrigger value="clasificacion">{t('tabs.clasificacion')}</TabsTrigger>
            <TabsTrigger value="temporal">{t('tabs.temporal')}</TabsTrigger>
            <TabsTrigger value="responsables">{t('tabs.responsables')}</TabsTrigger>
            <TabsTrigger value="ods">{t('tabs.ods')}</TabsTrigger>
            <TabsTrigger value="presupuesto">{t('tabs.presupuesto')}</TabsTrigger>
            <TabsTrigger value="adicional">{t('tabs.adicional')}</TabsTrigger>
            <TabsTrigger value="evidencias">{t('tabs.evidencias')}</TabsTrigger>
            <TabsTrigger value="indicadores">{t('tabs.indicadores')}</TabsTrigger>
          </TabsList>

          {/* Datos Básicos */}
          <TabsContent value="basicos" className="space-y-4">
            <Card><CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>{t('form.name-label')}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('form.name-placeholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.summary-label')}</Label>
                <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.objective-label')}</Label>
                <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.status-label')}</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ActionStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* Clasificación */}
          <TabsContent value="clasificacion" className="space-y-4">
            <Card><CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>{t('form.axes-label')}</Label>
                <div className="flex flex-wrap gap-2">
                  {getAxisOptions(locale).map((axis) => (
                    <Button
                      key={axis.value}
                      type="button"
                      variant={selectedAxes.includes(axis.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedAxes((prev) =>
                          prev.includes(axis.value) ? prev.filter((a) => a !== axis.value) : [...prev, axis.value]
                        );
                      }}
                    >
                      {axis.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('form.scopes-label')}</Label>
                <div className="flex flex-wrap gap-2">
                  {scopesList?.map((scope: any) => (
                    <Button
                      key={scope.id}
                      type="button"
                      variant={selectedScopes.includes(scope.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedScopes((prev) =>
                          prev.includes(scope.id) ? prev.filter((s) => s !== scope.id) : [...prev, scope.id]
                        );
                      }}
                    >
                      <ScopeIcon icon={scope.icon} axis={scope.axis} acronym={scope.acronym} size="sm" />
                      <span>{getScopeName(scope.acronym, locale, scope.name)}</span>
                    </Button>
                  ))}
                  {(!scopesList || scopesList.length === 0) && (
                    <span className="text-sm text-gray-400">{t('form.no-scopes')}</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('form.complexity-label')}</Label>
                <Select value={complexity} onValueChange={setComplexity}>
                  <SelectTrigger><SelectValue placeholder={t('form.complexity-placeholder')} /></SelectTrigger>
                  <SelectContent>
                    {COMPLEXITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{t(`complexity.${opt}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('form.horizon-label')}</Label>
                <Select value={horizon} onValueChange={setHorizon}>
                  <SelectTrigger><SelectValue placeholder={t('form.horizon-placeholder')} /></SelectTrigger>
                  <SelectContent>
                    {HORIZON_OPTIONS.map((key) => (
                      <SelectItem key={key} value={key}>{t(`horizon.${key}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* Temporal */}
          <TabsContent value="temporal" className="space-y-4">
            <Card><CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.start-date-label')}</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('form.end-date-label')}</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('form.description-label')}</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* Responsables */}
          <TabsContent value="responsables" className="space-y-4">
            <Card><CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>{t('form.responsible-person-label')}</Label>
                <Input value={responsiblePerson} onChange={(e) => setResponsiblePerson(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.responsible-area-label')}</Label>
                <Select value={responsibleArea} onValueChange={setResponsibleArea}>
                  <SelectTrigger><SelectValue placeholder={t('form.responsible-area-placeholder')} /></SelectTrigger>
                  <SelectContent>
                    {areas?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('form.actors-label')}</Label>
                <Textarea value={actors} onChange={(e) => setActors(e.target.value)} rows={2} />
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* ODS */}
          <TabsContent value="ods" className="space-y-4">
            <Card><CardContent className="pt-6 space-y-4">
              <p className="text-sm text-gray-500">{t('form.ods-help')}</p>
              {ods.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Select value={item.ods_id} onValueChange={(v) => {
                    const newOds = [...ods];
                    newOds[i].ods_id = v;
                    setOds(newOds);
                  }}>
                    <SelectTrigger className="w-40"><SelectValue placeholder={t('form.ods-placeholder')} /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 17 }, (_, j) => (
                        <SelectItem key={j + 1} value={`ods_${j + 1}`}>ODS {j + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={item.contribution} onChange={(e) => {
                    const newOds = [...ods];
                    newOds[i].contribution = e.target.value;
                    setOds(newOds);
                  }} placeholder={t('form.contribution-placeholder')} className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setOds(ods.filter((_, j) => j !== i))}>
                    ✕
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setOds([...ods, { ods_id: '', contribution: '' }])}>
                {t('form.add-ods')}
              </Button>
            </CardContent></Card>
          </TabsContent>

          {/* Presupuesto */}
          <TabsContent value="presupuesto" className="space-y-4">
            <Card><CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.budget-amount-label')}</Label>
                  <Input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('form.budget-currency-label')}</Label>
                  <Select value={budgetCurrency} onValueChange={setBudgetCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.budget-executed-label')}</Label>
                  <Input type="number" value={budgetExecuted} onChange={(e) => setBudgetExecuted(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('form.budget-source-label')}</Label>
                  <Input value={budgetSource} onChange={(e) => setBudgetSource(e.target.value)} />
                </div>
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* Adicional */}
          <TabsContent value="adicional" className="space-y-4">
            <Card><CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>{t('form.website-label')}</Label>
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>{t('form.photo-url-label')}</Label>
                <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>{t('form.awards-label')}</Label>
                <Textarea value={awards} onChange={(e) => setAwards(e.target.value)} rows={2} />
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* Indicadores vinculados (F4-03) */}
          <TabsContent value="indicadores" className="space-y-4">
            {action && (
              <LinkedIndicatorsSection
                action={action}
                evaluationId={evaluationId}
                onRefresh={mutate}
              />
            )}
          </TabsContent>

          {/* Evidencias */}
          <TabsContent value="evidencias" className="space-y-4">
            <EvidenceSection actionId={id} evaluationId={evaluationId} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Link href="/acciones">
            <Button type="button" variant="outline">{ct('cancel')}</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? t('form.saving') : (isNew ? t('form.create') : t('form.save-changes'))}
          </Button>
        </div>
      </form>
    </div>
  );
}
