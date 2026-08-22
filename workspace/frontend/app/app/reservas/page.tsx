'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleDot, Clock3, MapPin, Users, Waves } from 'lucide-react';
import { localDemoBalneario, type DemoUnit, type DemoUnitStatus } from '@/demo/balne-fixture';
import { useBalneario, usePlanUnits } from '@/sdk/hooks/use-bookings';
import { createCustomer, createInternalReservation, listReservations, updateReservationStatus, type BookingsPlanUnit, type BookingsReservation, type ReservationStatus } from '@/sdk/api/bookings-api';
import { getDraftPlan, getDraftSlugs, saveDraftPlan } from '@/lib/draft-plan';
import { balnearioPlans } from '@/demo/plans';
import type { PlanUnit } from '@/demo/plans/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Filter = 'all' | DemoUnitStatus;

const statusMeta: Record<DemoUnitStatus, { label: string; marker: string; badge: string }> = {
  available: { label: 'Disponible', marker: 'bg-emerald-500', badge: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  occupied: { label: 'Ocupada', marker: 'bg-sky-500', badge: 'border-sky-200 bg-sky-50 text-sky-800' },
  held: { label: 'En espera', marker: 'bg-amber-500', badge: 'border-amber-200 bg-amber-50 text-amber-800' },
};

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: localDemoBalneario.currency,
  maximumFractionDigits: 0,
});

const DEFAULT_LIVE_TARIFF = 78000;

function mapApiUnitsToDemoUnits(units: BookingsPlanUnit[]): DemoUnit[] {
  return units
    .filter((u) => u.is_rentable)
    .map((u) => ({
      id: u.id,
      label: `Unidad ${u.unit_number}`,
      sector: `Zona ${u.zone}`,
      capacity: u.capacity,
      status: (u.status === 'maintenance' ? 'held' : u.status) as DemoUnitStatus,
      tariff: DEFAULT_LIVE_TARIFF,
    }));
}

function mapDraftUnitsToDemoUnits(units: PlanUnit[]): DemoUnit[] {
  return units.map((u) => ({
    id: u.id,
    label: u.label,
    sector: `Zona ${u.zoneId}`,
    capacity: u.capacity,
    status: (u.status === 'maintenance' ? 'held' : u.status) as DemoUnitStatus,
    tariff: DEFAULT_LIVE_TARIFF,
  }));
}

export default function ReservationsPage() {
  const [activeSlug, setActiveSlug] = useState('cocodrilo-pinamar');
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
  }, [activeSlug]);

  const { balneario, isLive: balnearioLive } = useBalneario(activeSlug);
  const { units: liveUnits, isLive: unitsLive } = usePlanUnits(activeSlug);
  const isLive = balnearioLive && unitsLive && !!liveUnits && liveUnits.length > 0;

  const draftPlan = typeof window !== 'undefined' ? getDraftPlan(activeSlug) : null;
  const hasDraft = !!draftPlan && draftPlan.units.length > 0;

  const units = useMemo<DemoUnit[]>(
    () =>
      hasDraft
        ? mapDraftUnitsToDemoUnits(draftPlan!.units)
        : isLive && liveUnits
        ? mapApiUnitsToDemoUnits(liveUnits)
        : [...localDemoBalneario.units],
    [hasDraft, draftPlan, isLive, liveUnits],
  );
  const venueName = hasDraft ? draftPlan!.venueName : isLive && balneario ? balneario.name : localDemoBalneario.name;
  const venueLocation = hasDraft ? draftPlan!.location : isLive && balneario ? balneario.location : localDemoBalneario.location;


  const [filter, setFilter] = useState<Filter>('all');
  const [selectedUnit, setSelectedUnit] = useState<DemoUnit | null>(null);
  const [customer, setCustomer] = useState('');
  const [period, setPeriod] = useState<string>(localDemoBalneario.periodLabel);
  const [guests, setGuests] = useState('2');
  const [notes, setNotes] = useState('');
  const [paymentIntent, setPaymentIntent] = useState('A coordinar');
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [confirmationMode, setConfirmationMode] = useState<'live' | 'demo'>('demo');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableCount = units.filter((unit) => unit.status === 'available').length;
  const capacity = units.reduce((total, unit) => total + unit.capacity, 0);
  const occupiedCapacity = units
    .filter((unit) => unit.status === 'occupied')
    .reduce((total, unit) => total + unit.capacity, 0);
  const visibleUnits = filter === 'all' ? units : units.filter((unit) => unit.status === filter);
  const sectors = [...new Set(visibleUnits.map((unit) => unit.sector))];

  function openReservation(unit: DemoUnit) {
    if (unit.status !== 'available') return;
    setSelectedUnit(unit);
    setGuests(String(Math.min(2, unit.capacity)));
    setCustomer('');
    setPeriod(localDemoBalneario.periodLabel);
    setNotes('');
    setPaymentIntent('A coordinar');
    setFormError('');
  }

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUnit) return;

    const guestCount = Number(guests);
    if (!customer.trim()) {
      setFormError('Ingresá el nombre de la persona titular.');
      return;
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > selectedUnit.capacity) {
      setFormError(`La unidad admite entre 1 y ${selectedUnit.capacity} personas.`);
      return;
    }

    if (isLive && balneario) {
      setSubmitting(true);
      setFormError('');
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const iso = (d: Date) => d.toISOString().slice(0, 10);

        const cust = await createCustomer({ name: customer.trim(), email: '', phone: '' });
        const created = await createInternalReservation({
          balneario_id: balneario.id,
          unit_id: selectedUnit.id,
          customer_id: cust.id,
          start_date: iso(today),
          end_date: iso(tomorrow),
          guest_count: guestCount,
          total_price: selectedUnit.tariff,
          notes,
        });
        setConfirmation(`Reserva ${created.id} registrada para ${customer.trim()} en ${selectedUnit.label}.`);
        setConfirmationMode('live');
        setSelectedUnit(null);
        setSubmitting(false);
        return;
      } catch (err) {
        setSubmitting(false);
        console.warn('bookings-api: internal reservation failed, falling back to demo', err);
      }
    }

    if (hasDraft && selectedUnit) {
      const updatedPlan = {
        ...draftPlan!,
        units: draftPlan!.units.map((u) =>
          u.id === selectedUnit.id ? { ...u, status: 'occupied' as const } : u,
        ),
      };
      saveDraftPlan(activeSlug, updatedPlan);
    }

    setConfirmation(`Reserva de muestra preparada para ${customer.trim()} en ${selectedUnit.label}.`);
    setConfirmationMode('demo');
    setSelectedUnit(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <section className="overflow-hidden rounded-2xl bg-[#063b4c] px-6 py-7 text-white shadow-sm sm:px-8">
        <p className="text-xs font-bold tracking-[0.18em] text-cyan-200">OPERACIÓN INTERNA</p>
        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Reservas</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-cyan-50"><MapPin className="h-4 w-4" />{venueName} · {venueLocation}</p>
            <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${hasDraft ? 'bg-sky-500/20 text-sky-200' : isLive ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}><span className={`size-1.5 rounded-full ${hasDraft ? 'bg-sky-400' : isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />{hasDraft ? 'Plano Editado' : isLive ? 'Datos en vivo' : 'Demo local'}</span>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm">
            <p className="font-semibold">{localDemoBalneario.dateLabel}</p>
            <p className="mt-0.5 text-cyan-100">{localDemoBalneario.periodLabel}</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2" aria-label="Seleccionar balneario para reservas">
        {availablePlans.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={item.id === activeSlug ? 'default' : 'outline'}
            onClick={() => {
              setActiveSlug(item.id);
              setSelectedUnit(null);
            }}
          >
            {item.venueName} {item.isDraft ? '(Editado)' : ''}
          </Button>
        ))}
      </div>

      {hasDraft ? (
        <div className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <strong>PLANO EDITADO.</strong> Mostrando las unidades del borrador guardado localmente desde el editor.
        </div>
      ) : isLive ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <strong>DATOS EN VIVO.</strong> Las unidades se obtienen desde bookings-service.
        </div>
      ) : (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>DEMO LOCAL.</strong> Esta pantalla usa el fixture compartido y sólo simula la preparación de una reserva.
        </div>
      )}

      {confirmation && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${confirmationMode === 'live' ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-emerald-200 bg-emerald-50 text-emerald-950'}`} role="status">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <p className="font-semibold">{confirmationMode === 'live' ? 'Reserva registrada' : 'Confirmación local'}</p>
            <p className="text-sm">{confirmation} {confirmationMode === 'live' ? 'La reserva fue creada en bookings-service.' : 'No se realizó ningún cambio operativo.'}</p>
          </div>
          <button type="button" className="ml-auto text-sm font-medium text-emerald-800 underline" onClick={() => setConfirmation(null)}>Cerrar</button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Unidades disponibles" value={`${availableCount}/${units.length}`} detail="listas para seleccionar" icon={<Waves className="h-5 w-5" />} />
        <Metric label="Capacidad en uso" value={`${occupiedCapacity}/${capacity}`} detail="plazas de unidades ocupadas" icon={<Users className="h-5 w-5" />} />
        <Metric label="Periodo operativo" value="Hoy" detail={localDemoBalneario.periodLabel} icon={<Clock3 className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <CardTitle>Mapa operativo de unidades</CardTitle>
                <CardDescription className="mt-1">Elegí una unidad disponible para iniciar una reserva interna.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Filtrar unidades por estado">
                {(['all', 'available', 'occupied', 'held'] as Filter[]).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={filter === value ? 'default' : 'outline'}
                    className={filter === value ? 'bg-[#063b4c] hover:bg-[#0b5267]' : ''}
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                  >
                    {value === 'all' ? 'Todas' : statusMeta[value].label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
              {Object.entries(statusMeta).map(([status, meta]) => <span key={status} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${meta.marker}`} />{meta.label}</span>)}
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-[#063b4c]" />Seleccionada</span>
            </div>

            {sectors.map((sector) => (
              <div key={sector}>
                <h2 className="mb-3 text-sm font-semibold text-slate-700">{sector}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visibleUnits.filter((unit) => unit.sector === sector).map((unit) => {
                    const isAvailable = unit.status === 'available';
                    const isSelected = selectedUnit?.id === unit.id;
                    return (
                      <button
                        key={unit.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => openReservation(unit)}
                        className={`min-h-32 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-[#063b4c] focus:ring-offset-2 ${isSelected ? 'border-2 border-[#063b4c] bg-cyan-50 shadow-sm' : isAvailable ? 'border-emerald-200 bg-emerald-50 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-sm' : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-75'}`}
                        aria-label={`${unit.label}: ${statusMeta[unit.status].label}${isAvailable ? '. Abrir formulario de reserva' : ''}`}
                      >
                        <span className={`mb-4 block h-2 w-10 rounded-full ${statusMeta[unit.status].marker}`} />
                        <span className="block text-base font-semibold text-slate-950">{unit.label}</span>
                        <span className="mt-1 block text-xs text-slate-600">Hasta {unit.capacity} personas</span>
                        <span className="mt-3 block text-xs font-medium text-slate-700">{isSelected ? 'Seleccionada' : statusMeta[unit.status].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {visibleUnits.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No hay unidades con este estado.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listado operativo</CardTitle>
            <CardDescription>Detalle de capacidad y valor diario de referencia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {visibleUnits.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{unit.label}</p>
                  <p className="text-xs text-slate-500">{unit.capacity} personas · {currency.format(unit.tariff)} por día</p>
                </div>
                <Badge variant="outline" className={`shrink-0 ${statusMeta[unit.status].badge}`}>{statusMeta[unit.status].label}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Dialog open={selectedUnit !== null} onOpenChange={(open) => !open && setSelectedUnit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Preparar reserva interna</DialogTitle>
            <DialogDescription>{selectedUnit ? `${selectedUnit.label} · ${selectedUnit.sector} · ${currency.format(selectedUnit.tariff)} por día` : ''}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitReservation}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer">Titular</Label>
                <Input id="customer" value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Nombre y apellido" autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Cantidad de personas</Label>
                <Input id="guests" type="number" min="1" max={selectedUnit?.capacity} value={guests} onChange={(event) => setGuests(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Periodo</Label>
              <select id="period" value={period} onChange={(event) => setPeriod(event.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option>{localDemoBalneario.periodLabel}</option>
              </select>
              <p className="text-xs text-slate-500">{localDemoBalneario.dateLabel}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-intent">Intención de cobro</Label>
              <select id="payment-intent" value={paymentIntent} onChange={(event) => setPaymentIntent(event.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option>A coordinar</option>
                <option>Transferencia a verificar</option>
                <option>Pago presencial pendiente</option>
              </select>
              <p className="text-xs text-slate-500">Referencia interna solamente: no se procesa ni registra dinero.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas operativas</Label>
              <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Preferencias, contacto o indicaciones para el equipo." />
            </div>
            {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{formError}</p>}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setSelectedUnit(null)}>Cancelar</Button>
              <Button type="submit" disabled={submitting} className="bg-[#063b4c] hover:bg-[#0b5267]"><CircleDot className="h-4 w-4" />{submitting ? 'Enviando…' : isLive ? 'Confirmar reserva' : 'Confirmar demo local'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-xl bg-cyan-50 p-3 text-[#063b4c]">{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="text-2xl font-semibold text-slate-950">{value}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
