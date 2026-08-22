'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Edit3, Layers, MapPin, Plus, Settings2, Users } from 'lucide-react';
import { balnearioPlans, getBalnearioPlan } from '@/demo/plans';
import type { BalnearioPlan as BalnearioPlanData, PlanUnit } from '@/demo/plans/model';
import { BalnearioPlan } from '@/components/organisms/BalnearioPlan';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBalneario, usePlanUnits } from '@/sdk/hooks/use-bookings';
import { buildLivePlan } from '@/demo/plans/live-adapter';
import { getDraftPlan, getDraftSlugs } from '@/lib/draft-plan';

const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function PlanificationPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Cargando plano activo…</div>}>
      <PlanificationContent />
    </Suspense>
  );
}

function PlanificationContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams?.get('slug') || 'cocodrilo-pinamar';
  const [planId, setPlanId] = useState(initialSlug);
  const [selectedUnit, setSelectedUnit] = useState<PlanUnit | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Array<{ id: string; venueName: string; isDraft: boolean }>>([]);

  useEffect(() => {
    const list: Array<{ id: string; venueName: string; isDraft: boolean }> = [];
    const draftSlugs = typeof window !== 'undefined' ? getDraftSlugs() : [];
    for (const slug of draftSlugs) {
      const draft = getDraftPlan(slug);
      if (draft) {
        list.push({ id: slug, venueName: draft.venueName || slug, isDraft: true });
      }
    }
    for (const fixture of balnearioPlans) {
      if (!list.some((p) => p.id === fixture.id)) {
        list.push({ id: fixture.id, venueName: fixture.venueName, isDraft: false });
      }
    }
    setAvailablePlans(list);
  }, [planId]);

  const { balneario, isLive: balnearioLive } = useBalneario(planId);
  const { units: liveUnits, isLive: unitsLive } = usePlanUnits(planId);
  const isLive = balnearioLive && unitsLive && !!balneario && !!liveUnits && liveUnits.length > 0;

  const isDraft = typeof window !== 'undefined' && !!getDraftPlan(planId);

  const plan = useMemo<BalnearioPlanData>(
    () => (isLive && balneario && liveUnits ? buildLivePlan(balneario, liveUnits) : getBalnearioPlan(planId)),
    [planId, isLive, balneario, liveUnits],
  );

  const available = plan.units.filter((unit) => unit.status === 'available').length;
  const zone = selectedUnit && plan.zones.find((item) => item.id === selectedUnit.zoneId);
  const tariff = selectedUnit && plan.tariffs.find((item) => item.id === selectedUnit.tariffId);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <section className="rounded-2xl bg-[#063b4c] px-6 py-7 text-white sm:px-8">
        <p className="text-xs font-bold tracking-[0.18em] text-cyan-200">OPERACIÓN INTERNA · PLANO ACTIVO</p>
        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold">{plan.venueName}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-cyan-50">
              <MapPin className="size-4" />
              {plan.location}
            </p>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                isDraft
                  ? 'bg-sky-500/20 text-sky-200'
                  : isLive
                  ? 'bg-emerald-500/20 text-emerald-200'
                  : 'bg-amber-500/20 text-amber-200'
              }`}
            >
              <span className={`size-1.5 rounded-full ${isDraft ? 'bg-sky-400' : isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isDraft ? 'Plano Editado' : isLive ? 'Datos en vivo' : 'Demo local'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="bg-[#f0512d] text-white hover:bg-[#dc4829]">
              <Link href="/app/planos/editor">
                <Edit3 className="size-4" />
                Editar en Lienzo
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Link href="/app/planos">
                <Layers className="size-4" />
                Mis Planos
              </Link>
            </Button>
          </div>
        </div>
      </section>
      {isDraft ? (
        <div className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <strong>PLANO EDITADO.</strong> Mostrando la distribución y unidades guardadas localmente desde el editor.
        </div>
      ) : isLive ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <strong>DATOS EN VIVO.</strong> El plano y el estado de las unidades provienen directamente de bookings-service.
        </div>
      ) : (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>DEMO LOCAL.</strong> El plano, estados y tarifas viven sólo en el fixture. Seleccionar una carpa no crea reservas ni cobros.
        </div>
      )}
      <div className="flex flex-wrap gap-2" aria-label="Seleccionar balneario">
        {availablePlans.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={item.id === planId ? 'default' : 'outline'}
            onClick={() => {
              setPlanId(item.id);
              setSelectedUnit(null);
            }}
          >
            {item.venueName} {item.isDraft ? '(Editado)' : ''}
          </Button>
        ))}
      </div>
      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.7fr]">
        <BalnearioPlan plan={plan} selectedUnitId={selectedUnit?.id} onSelectUnit={setSelectedUnit} />
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Selección operativa</CardTitle>
            <CardDescription>Consultá una carpa tocándola o con Tab y Enter.</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUnit && zone && tariff ? (
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-semibold text-slate-950">{selectedUnit.label}</p>
                  <p className="text-sm text-slate-500">
                    {zone.label} · hasta {selectedUnit.capacity} personas
                  </p>
                </div>
                <Badge variant="outline">
                  {selectedUnit.status === 'available'
                    ? 'Disponible'
                    : selectedUnit.status === 'occupied'
                    ? 'Ocupada'
                    : selectedUnit.status === 'held'
                    ? 'En espera'
                    : 'Mantenimiento'}
                </Badge>
                <dl className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">ID estable</dt>
                    <dd className="text-right font-mono text-xs">{selectedUnit.id}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Tarifa de referencia</dt>
                    <dd className="font-medium">{currency.format(tariff.dailyPrice)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Estado</dt>
                    <dd className="font-medium">{selectedUnit.status}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Elegí una unidad para ver su zona, capacidad, tarifa y estado.
              </p>
            )}
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link href="/app/planificacion/configuracion">
                <Settings2 className="size-4" />
                Ver configuración inicial
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Unidades" value={plan.units.length} detail="unidades numeradas" />
        <Metric label="Zonas" value={plan.zones.length} detail="zonas configuradas" />
        <Metric label="Capacidad" value={plan.units.reduce((total, unit) => total + unit.capacity, 0)} detail="plazas modeladas" />
      </section>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-xl bg-cyan-50 p-3 text-[#063b4c]">
          <Users className="size-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

