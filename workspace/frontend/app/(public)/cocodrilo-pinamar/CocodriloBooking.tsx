'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, MapPin, Users, Waves } from 'lucide-react';
import { cocodriloPinamarPlan } from '@/demo/plans/cocodrilo-pinamar';
import type { BalnearioPlan as BalnearioPlanData, PlanUnit } from '@/demo/plans/model';
import { BalnearioPlan } from '@/components/organisms/BalnearioPlan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBalneario, usePlanUnits } from '@/sdk/hooks/use-bookings';
import { createPublicReservation } from '@/sdk/api/bookings-api';
import { buildLivePlan } from '@/demo/plans/live-adapter';
import { getDraftPlan, saveDraftPlan } from '@/lib/draft-plan';

const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

interface PlanBookingProps {
  plan: BalnearioPlanData;
  referencePrefix: string;
  slug: string;
}

function LiveBadge({ isLive }: { isLive: boolean }) {
  if (isLive) {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-800"><span className="size-1.5 rounded-full bg-emerald-500" />Datos en vivo</span>;
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-900"><span className="size-1.5 rounded-full bg-amber-500" />Demo local</span>;
}

export function PlanBooking({ plan: fixturePlan, referencePrefix, slug }: PlanBookingProps) {
  const { balneario, isLive: balnearioLive } = useBalneario(slug);
  const { units, isLive: unitsLive } = usePlanUnits(slug);
  const isLive = balnearioLive && unitsLive && !!balneario && !!units && units.length > 0;

  // Priority: localStorage draft → API live data → fixture
  const draftPlan = typeof window !== 'undefined' ? getDraftPlan(slug) : null;
  const hasDraft = !!draftPlan && draftPlan.units.length > 0;

  const plan = useMemo<BalnearioPlanData>(
    () => (hasDraft ? draftPlan! : isLive && balneario && units ? buildLivePlan(balneario, units) : fixturePlan),
    [hasDraft, draftPlan, isLive, balneario, units, fixturePlan],
  );

  const [selectedUnit, setSelectedUnit] = useState<PlanUnit | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [guests, setGuests] = useState('2');
  const [error, setError] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [referenceMode, setReferenceMode] = useState<'live' | 'demo'>('demo');
  const [submitting, setSubmitting] = useState(false);
  const tariff = selectedUnit && plan.tariffs.find((item) => item.id === selectedUnit.tariffId);

  // Clear selection when switching between live and demo plans (unit IDs differ).
  useEffect(() => {
    setSelectedUnit(null);
  }, [isLive]);

  function selectUnit(unit: PlanUnit) {
    if (unit.status !== 'available') return;
    setSelectedUnit(unit);
    setGuests(String(Math.min(2, unit.capacity)));
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const guestCount = Number(guests);
    if (!selectedUnit) return setError('Elegí una carpa disponible en el plano para continuar.');
    if (!name.trim() || !email.includes('@')) return setError('Ingresá tu nombre y un email válido para esta demostración.');
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > selectedUnit.capacity) return setError(`La carpa admite entre 1 y ${selectedUnit.capacity} personas.`);

    if (isLive) {
      setSubmitting(true);
      setError('');
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const iso = (d: Date) => d.toISOString().slice(0, 10);
        const created = await createPublicReservation(slug, {
          unit_id: selectedUnit.id,
          start_date: iso(today),
          end_date: iso(tomorrow),
          guest_count: guestCount,
          total_price: tariff?.dailyPrice ?? 0,
          notes: '',
          customer: { name: name.trim(), email: email.trim(), phone: '' },
        });
        setReference(created.id);
        setReferenceMode('live');
        setSubmitting(false);
        return;
      } catch (err) {
        // Fall through to local demo confirmation on any API failure.
        setSubmitting(false);
        console.warn('bookings-api: public reservation failed, falling back to demo', err);
      }
    }

    if (hasDraft && selectedUnit) {
      const updatedPlan = {
        ...draftPlan!,
        units: draftPlan!.units.map((u) =>
          u.id === selectedUnit.id ? { ...u, status: 'occupied' as const } : u,
        ),
      };
      saveDraftPlan(slug, updatedPlan);
    }

    setReference(`${referencePrefix}-LOCAL-${String(selectedUnit.number).padStart(3, '0')}`);
    setReferenceMode('demo');
  }

  if (reference && selectedUnit) {
    const isLiveConfirm = referenceMode === 'live';
    return <main className="min-h-screen bg-[#f7f0df] px-5 py-6 text-[#174d4b] sm:px-8"><Header venueName={plan.venueName} /><section className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-emerald-200 bg-white p-8 shadow-[0_22px_60px_rgba(23,77,75,0.12)]" role="status"><CheckCircle2 className="size-12 text-emerald-600" /><div className="mt-6"><LiveBadge isLive={isLiveConfirm} /></div><p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#df4c2c]">{isLiveConfirm ? 'Reserva registrada' : 'Solicitud de demostración'}</p><h1 className="mt-3 text-4xl">{isLiveConfirm ? 'Tu reserva quedó registrada.' : 'Tu selección local quedó preparada.'}</h1><p className="mt-4 text-slate-600">{selectedUnit.label} · {tariff && currency.format(tariff.dailyPrice)}. {isLiveConfirm ? 'La unidad fue reservada con el identificador generado por el servicio.' : 'No se reservó la unidad, no se cobró ni se guardaron tus datos.'}</p><div className="mt-6 rounded-2xl bg-[#e6f2ed] p-4"><p className="text-xs font-bold uppercase tracking-wide">{isLiveConfirm ? 'Referencia de reserva' : 'Referencia local'}</p><p className="mt-1 break-all text-xl font-black">{reference}</p></div><Button className="mt-6 rounded-full bg-[#174d4b] hover:bg-[#0e3b3a]" onClick={() => { setReference(null); setSelectedUnit(null); }}>Elegir otra unidad</Button></section></main>;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f0df] text-[#174d4b]">
       <Header venueName={plan.venueName} />
       <section className="bg-[#ffe17b] px-5 py-12 sm:px-8 lg:py-16"><div className="mx-auto max-w-7xl"><p className="inline-flex items-center gap-2 rounded-full bg-[#174d4b] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#fff3c7]"><Waves className="size-4" />{plan.location}</p><h1 className="mt-6 max-w-3xl text-5xl leading-[0.96] sm:text-6xl">Elegí tu lugar antes de llegar a la playa.</h1><p className="mt-5 max-w-2xl text-lg text-[#345c58]">Explorá el plano de {plan.venueName} para ubicar mejor tu lugar frente al mar.</p><div className="mt-5 flex flex-wrap items-center gap-3"><p className="flex items-center gap-2 font-semibold"><MapPin className="size-4" />{plan.location}</p><LiveBadge isLive={isLive} /></div></div></section>
       {hasDraft ? <div className="border-y border-sky-300 bg-sky-50 px-5 py-3 text-center text-sm font-semibold text-sky-950"><strong>PLANO DEL EDITOR.</strong> Mostrando el borrador guardado localmente desde el editor de planos. Esta es una vista previa local, no una reserva real.</div> : isLive ? <div className="border-y border-emerald-300 bg-emerald-50 px-5 py-3 text-center text-sm font-semibold text-emerald-950"><strong>DATOS EN VIVO.</strong> Unidades y disponibilidad provistas por bookings-service. La reserva se envía al backend real.</div> : <div className="border-y border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm font-semibold text-amber-950"><strong>DEMO LOCAL.</strong> Disponibilidad y tarifa son de muestra: no hay pago, WhatsApp, QR, persistencia ni bloqueo de unidades.</div>}
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:py-14">
        <div><div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#df4c2c]">1. Elegí tu lugar</p><h2 className="mt-2 text-3xl">Tocá una unidad verde disponible.</h2><p className="mt-2 text-sm text-[#526765]">En celular, acercá con los controles y arrastrá el plano. También podés recorrer las unidades con Tab y elegir con Enter.</p></div><BalnearioPlan plan={plan} selectedUnitId={selectedUnit?.id} onSelectUnit={selectUnit} selectable={(unit) => unit.status === 'available'} /></div>
        <section className="h-fit rounded-[1.75rem] border border-[#174d4b]/15 bg-white p-5 shadow-[0_16px_40px_rgba(23,77,75,0.08)] sm:p-7"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#df4c2c]">2. Tu visita</p><h2 className="mt-2 text-2xl">Completá la demostración</h2><form className="mt-6 space-y-5" onSubmit={submit}><div className="rounded-2xl bg-[#f7f0df] p-4"><p className="font-bold">{selectedUnit ? selectedUnit.label : 'Elegí una carpa'}</p><p className="mt-1 text-sm text-[#62716d]">{selectedUnit && tariff ? `${selectedUnit.capacity} personas · ${currency.format(tariff.dailyPrice)} por día` : 'La tarifa aparecerá al seleccionar una unidad.'}</p></div><div className="space-y-2"><Label htmlFor="guests" className="font-bold">Personas</Label><Input id="guests" type="number" min="1" max={selectedUnit?.capacity ?? 6} value={guests} onChange={(event) => setGuests(event.target.value)} /><p className="text-xs text-slate-500">Hasta {selectedUnit?.capacity ?? 6} personas.</p></div><div className="space-y-2"><Label htmlFor="name" className="font-bold">Nombre y apellido</Label><Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Como figura en la reserva" /></div><div className="space-y-2"><Label htmlFor="email" className="font-bold">Email</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vos@email.com" /></div>{error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}<Button type="submit" disabled={!selectedUnit || submitting} className="h-11 w-full rounded-full bg-[#f0512d] font-black hover:bg-[#dc4829]">{submitting ? 'Enviando…' : isLive ? 'Reservar unidad' : 'Preparar reserva local'}</Button></form></section>
      </section>
       <section className="bg-[#174d4b] px-5 py-10 text-[#f8f5ed]"><div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-3"><Info title="Plano por zonas" text="Las unidades se agrupan alrededor de patios y sectores identificables." /><Info title="Plano navegable" text="Acercá, alejá y desplazate para elegir unidades densas desde cualquier pantalla." /><Info title="Demo transparente" text="La selección sólo existe en el navegador y no equivale a una reserva real." /></div></section>
    </main>
  );
}

function Header({ venueName }: { venueName: string }) { return <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8"><Link href="/" className="inline-flex items-center gap-2 text-sm font-black hover:text-[#f0512d]"><ArrowLeft className="size-4" />Balne</Link><div className="text-right"><p className="font-serif text-xl font-black">{venueName}</p><Link href="/login" className="text-xs font-bold underline">Acceso para el equipo</Link></div></header>; }
function Info({ title, text }: { title: string; text: string }) { return <article className="rounded-2xl border border-white/15 bg-white/5 p-5"><Users className="size-5 text-[#f0cb91]" /><h2 className="mt-4 text-xl">{title}</h2><p className="mt-2 text-sm leading-relaxed text-[#d2e4da]">{text}</p></article>; }

export function CocodriloBooking() {
  return <PlanBooking plan={cocodriloPinamarPlan} referencePrefix="COCO" slug="cocodrilo-pinamar" />;
}
