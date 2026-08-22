'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  MapPin,
  Umbrella,
  Users,
  Waves,
} from 'lucide-react';
import { localDemoBalneario, type DemoPeriod, type DemoUnit, type DemoUnitStatus } from '@/demo/balne-fixture';
import { getDraftPlan } from '@/lib/draft-plan';
import type { BalnearioPlan as BalnearioPlanData, PlanUnit } from '@/demo/plans/model';
import { BalnearioPlan as PlanRenderer } from '@/components/organisms/BalnearioPlan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: localDemoBalneario.currency,
  maximumFractionDigits: 0,
});

const statusMeta: Record<DemoUnitStatus, { label: string; classes: string }> = {
  available: { label: 'Disponible', classes: 'border-emerald-300 bg-emerald-50 text-emerald-950 hover:border-emerald-500 hover:bg-emerald-100' },
  occupied: { label: 'Ocupada', classes: 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500' },
  held: { label: 'En espera', classes: 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-800' },
};

export function LaMareaBooking() {
  const draftPlan = typeof window !== 'undefined' ? getDraftPlan('la-marea') : null;
  const hasDraft = !!draftPlan && draftPlan.units.length > 0;

  if (hasDraft) {
    return <DraftPlanBooking plan={draftPlan!} />;
  }
  return <FixtureBooking />;
}

function DraftPlanBooking({ plan }: { plan: BalnearioPlanData }) {
  const [selectedUnit, setSelectedUnit] = useState<PlanUnit | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [guests, setGuests] = useState('2');
  const [error, setError] = useState('');
  const [reference, setReference] = useState<string | null>(null);

  const tariff = selectedUnit && plan.tariffs.find((item) => item.id === selectedUnit.tariffId);
  const total = selectedUnit && tariff ? tariff.dailyPrice : 0;
  const guestCount = Number(guests);

  function selectUnit(unit: PlanUnit) {
    if (unit.status !== 'available') return;
    setSelectedUnit(unit);
    setGuests(String(Math.min(2, unit.capacity)));
    setError('');
  }

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUnit) return setError('Elegí una unidad disponible en el plano.');
    if (!name.trim() || !email.includes('@')) return setError('Ingresá nombre y un email válido.');
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > selectedUnit.capacity) return setError(`La unidad admite entre 1 y ${selectedUnit.capacity} personas.`);
    setReference(`LM-DRAFT-${selectedUnit.number}`);
    setError('');
  }

  if (reference && selectedUnit) {
    return (
      <main className="min-h-screen bg-[#f7f0df] px-5 py-6 text-[#174d4b] sm:px-8">
        <Header venueName={plan.venueName} />
        <section className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-sky-200 bg-white p-8 shadow-[0_22px_60px_rgba(23,77,75,0.12)]" role="status">
          <CheckCircle2 className="size-12 text-sky-600" />
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#df4c2c]">Vista previa del editor</p>
          <h1 className="mt-3 text-4xl">Tu selección quedó preparada.</h1>
          <p className="mt-4 text-slate-600">{selectedUnit.label}. No se reservó la unidad ni se guardaron datos.</p>
          <div className="mt-6 rounded-2xl bg-[#e6f2ed] p-4"><p className="text-xs font-bold uppercase">Referencia local</p><p className="mt-1 text-xl font-black">{reference}</p></div>
          <Button className="mt-6 rounded-full bg-[#174d4b] hover:bg-[#0e3b3a]" onClick={() => { setReference(null); setSelectedUnit(null); }}>Elegir otra unidad</Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f0df] text-[#174d4b]">
      <Header venueName={plan.venueName} />
      <section className="bg-[#ffe17b] px-5 py-12 sm:px-8 lg:py-16"><div className="mx-auto max-w-7xl"><p className="inline-flex items-center gap-2 rounded-full bg-[#174d4b] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#fff3c7]"><Waves className="size-4" />{plan.location}</p><h1 className="mt-6 max-w-3xl text-5xl leading-[0.96] sm:text-6xl">Elegí tu lugar antes de llegar a la playa.</h1><p className="mt-5 max-w-2xl text-lg text-[#345c58]">Explorá el plano de {plan.venueName} para ubicar mejor tu lugar frente al mar.</p></div></section>
      <div className="border-y border-sky-300 bg-sky-50 px-5 py-3 text-center text-sm font-semibold text-sky-950"><strong>PLANO DEL EDITOR.</strong> Mostrando el borrador guardado localmente. Esta es una vista previa local, no una reserva real.</div>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:py-14">
        <div><div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#df4c2c]">1. Elegí tu lugar</p><h2 className="mt-2 text-3xl">Tocá una unidad verde disponible.</h2></div><PlanRenderer plan={plan} selectedUnitId={selectedUnit?.id} onSelectUnit={selectUnit} selectable={(unit) => unit.status === 'available'} /></div>
        <section className="h-fit rounded-[1.75rem] border border-[#174d4b]/15 bg-white p-5 shadow-[0_16px_40px_rgba(23,77,75,0.08)] sm:p-7"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#df4c2c]">2. Tu visita</p><h2 className="mt-2 text-2xl">Datos de la demostración</h2><form className="mt-6 space-y-5" onSubmit={confirm}><div className="rounded-2xl bg-[#f7f0df] p-4"><p className="font-bold">{selectedUnit ? selectedUnit.label : 'Elegí una unidad'}</p><p className="mt-1 text-sm text-[#62716d]">{selectedUnit && tariff ? `${selectedUnit.capacity} personas · ${currency.format(tariff.dailyPrice)}` : 'La tarifa aparecerá al seleccionar.'}</p></div><div className="space-y-2"><Label htmlFor="guests" className="font-bold">Personas</Label><Input id="guests" type="number" min="1" max={selectedUnit?.capacity ?? 6} value={guests} onChange={(e) => setGuests(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="name" className="font-bold">Nombre y apellido</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como figura en la reserva" /></div><div className="space-y-2"><Label htmlFor="email" className="font-bold">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@email.com" /></div>{error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}<Button type="submit" disabled={!selectedUnit} className="h-11 w-full rounded-full bg-[#f0512d] font-black hover:bg-[#dc4829]"><Check className="size-4" />Preparar reserva local</Button></form></section>
      </section>
    </main>
  );
}

function FixtureBooking() {
  const [selectedUnit, setSelectedUnit] = useState<DemoUnit | null>(null);
  const [periodId, setPeriodId] = useState(localDemoBalneario.periods[1].id);
  const [guests, setGuests] = useState('2');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [reference, setReference] = useState<string | null>(null);

  const selectedPeriod = localDemoBalneario.periods.find((period) => period.id === periodId) ?? localDemoBalneario.periods[1];
  const total = selectedUnit ? Math.round(selectedUnit.tariff * selectedPeriod.priceMultiplier) : 0;
  const guestCount = Number(guests);

  function selectUnit(unit: DemoUnit) {
    if (unit.status !== 'available') return;
    setSelectedUnit(unit);
    setGuests(String(Math.min(2, unit.capacity)));
    setError('');
  }

  function confirmReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUnit) {
      setError('Elegí una unidad disponible para continuar.');
      return;
    }
    if (!name.trim() || !email.trim() || !email.includes('@')) {
      setError('Ingresá nombre y un email válido para identificar esta demostración.');
      return;
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > selectedUnit.capacity) {
      setError(`La unidad elegida admite entre 1 y ${selectedUnit.capacity} personas.`);
      return;
    }

    setReference(`LM-LOCAL-${selectedUnit.id.toUpperCase()}-0821`);
    setError('');
  }

  function startAgain() {
    setSelectedUnit(null);
    setPeriodId(localDemoBalneario.periods[1].id);
    setGuests('2');
    setName('');
    setEmail('');
    setPhone('');
    setReference(null);
  }

  if (reference && selectedUnit) {
    return (
      <main className="min-h-screen bg-[#f7f0df] px-5 py-6 text-[#174d4b] sm:px-8 lg:px-12">
        <Header venueName={localDemoBalneario.name} />
        <section className="mx-auto mt-12 max-w-2xl rounded-[2rem] border border-emerald-200 bg-white p-7 shadow-[0_22px_60px_rgba(23,77,75,0.12)] sm:p-10" role="status">
          <div className="grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-8" /></div>
          <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-[#df4c2c]">Reserva de demostración</p>
          <h1 className="mt-3 text-4xl text-[#174d4b] sm:text-5xl">Tu solicitud local quedó preparada.</h1>
          <p className="mt-5 text-lg leading-relaxed text-[#526765]">Guardamos un comprobante sólo en esta pantalla para que puedas recorrer el flujo. No reservamos la unidad, no procesamos pagos y no enviamos mensajes.</p>
          <div className="mt-8 rounded-2xl bg-[#e6f2ed] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#52726e]">Referencia local</p>
            <p className="mt-1 text-2xl font-black tracking-wide text-[#174d4b]">{reference}</p>
            <p className="mt-4 text-sm text-[#365d58]">{selectedUnit.label} · {selectedPeriod.label} · {currency.format(total)}</p>
          </div>
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950"><strong>Próximo paso en una versión real:</strong> el balneario confirmaría disponibilidad y te indicaría cómo pagar. Esta demo no crea una reserva válida ni guarda tus datos.</div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="button" onClick={startAgain} className="rounded-full bg-[#174d4b] px-5 hover:bg-[#0e3b3a]">Probar otra reserva</Button>
            <Link href="/" className="inline-flex h-9 items-center rounded-full border border-[#174d4b]/20 px-5 text-sm font-bold hover:bg-[#f7f0df]">Volver a Balne</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f0df] text-[#174d4b] selection:bg-[#f0512d] selection:text-white">
      <Header venueName={localDemoBalneario.name} />
      <section className="relative overflow-hidden bg-[#ffe17b] px-5 pb-16 pt-12 sm:px-8 lg:px-12 lg:pb-20">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-[#fff2bd]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#174d4b] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#fff3c7]"><Waves className="size-4" /> Frente al mar</p>
            <h1 className="mt-6 max-w-3xl text-5xl leading-[0.96] sm:text-6xl lg:text-7xl">Tu día de playa empieza con un lugar elegido.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#345c58]">Elegí una carpa o sombrilla en {localDemoBalneario.name}, sobre {localDemoBalneario.location}. Vista al mar, sombra y espacio para disfrutar sin improvisar.</p>
          </div>
          <div className="rounded-[1.6rem] bg-[#174d4b] p-6 text-[#f8f5ed] shadow-[0_12px_0_#e9b936]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f0cb91]">Contexto de la visita</p>
            <p className="mt-4 flex items-center gap-2 font-semibold"><MapPin className="size-4 text-[#f0cb91]" />{localDemoBalneario.location}</p>
            <p className="mt-3 flex items-center gap-2 text-sm text-[#d2e4da]"><Clock3 className="size-4 text-[#f0cb91]" />{localDemoBalneario.dateLabel}</p>
          </div>
        </div>
      </section>

      <div className="border-y border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm font-semibold text-amber-950"><strong>DEMO LOCAL.</strong> Disponibilidad, valores y confirmación son de muestra: no hay pago, WhatsApp, QR, persistencia ni bloqueo de unidades.</div>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-16">
        <div>
          <StepTitle number="1" title="Elegí tu lugar" text="Sólo las unidades disponibles se pueden seleccionar." />
          <div className="mt-6 rounded-[1.75rem] border border-[#174d4b]/15 bg-[#e7f1ed] p-4 shadow-[0_16px_40px_rgba(23,77,75,0.08)] sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-[#174d4b]/10 pb-4">
              <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#df4c2c]">Plano de playa</p><p className="mt-1 text-sm text-[#526765]">La línea superior mira al mar</p></div>
              <Waves className="size-7 text-[#398b87]" aria-hidden="true" />
            </div>
            <div className="mb-5 h-9 rounded-full bg-[#8fcac7] text-center text-xs font-black uppercase leading-9 tracking-[0.25em] text-[#174d4b]">Mar</div>
            <div className="grid gap-3 sm:grid-cols-3" aria-label="Unidades disponibles de Balneario La Marea">
              {localDemoBalneario.units.map((unit) => {
                const isAvailable = unit.status === 'available';
                const isSelected = selectedUnit?.id === unit.id;
                return (
                  <button key={unit.id} type="button" disabled={!isAvailable} onClick={() => selectUnit(unit)} aria-pressed={isSelected} className={`min-h-36 rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174d4b] ${isSelected ? 'border-[#f0512d] bg-[#f0512d] text-white shadow-[0_5px_0_#bd351e]' : statusMeta[unit.status].classes}`}>
                    <span className="flex items-start justify-between gap-2"><Umbrella className="size-5" /><span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">{statusMeta[unit.status].label}</span></span>
                    <span className="mt-7 block font-bold">{unit.label}</span>
                    <span className="mt-1 block text-xs opacity-80">{unit.sector} · hasta {unit.capacity}</span>
                    <span className="mt-3 block text-sm font-black">{currency.format(unit.tariff)}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#526765]"><span><i className="mr-1.5 inline-block size-2.5 rounded-full bg-emerald-500" />Disponible</span><span><i className="mr-1.5 inline-block size-2.5 rounded-full bg-slate-400" />Ocupada</span><span><i className="mr-1.5 inline-block size-2.5 rounded-full bg-amber-500" />En espera</span></div>
          </div>
        </div>

        <section className="rounded-[1.75rem] border border-[#174d4b]/15 bg-white p-5 shadow-[0_16px_40px_rgba(23,77,75,0.08)] sm:p-7">
          <StepTitle number="2" title="Definí tu visita" text="Elegí el período y quiénes vienen." />
          <form className="mt-6 space-y-5" onSubmit={confirmReservation}>
            <div className="space-y-2"><Label htmlFor="period" className="font-bold text-[#174d4b]">Período de demostración</Label><select id="period" value={periodId} onChange={(event) => setPeriodId(event.target.value)} className="h-11 w-full rounded-xl border border-[#cbd8d3] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#174d4b]">{localDemoBalneario.periods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}</select><p className="text-xs text-[#62716d]">{selectedPeriod.detail}</p></div>
            <div className="space-y-2"><Label htmlFor="guests" className="font-bold text-[#174d4b]">Cantidad de personas</Label><Input id="guests" type="number" min="1" max={selectedUnit?.capacity ?? 6} value={guests} onChange={(event) => setGuests(event.target.value)} className="h-11 rounded-xl border-[#cbd8d3]" /><p className="text-xs text-[#62716d]">{selectedUnit ? `${selectedUnit.label} admite hasta ${selectedUnit.capacity} personas.` : 'Elegí primero una unidad para validar la capacidad.'}</p></div>

            <div className="border-t border-[#e6ece8] pt-5"><StepTitle number="3" title="Tus datos" text="Sólo se usan para mostrar esta confirmación local." /></div>
            <div className="space-y-2"><Label htmlFor="name" className="font-bold text-[#174d4b]">Nombre y apellido</Label><Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Como figura en la reserva" className="h-11 rounded-xl border-[#cbd8d3]" /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="email" className="font-bold text-[#174d4b]">Email</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vos@email.com" className="h-11 rounded-xl border-[#cbd8d3]" /></div><div className="space-y-2"><Label htmlFor="phone" className="font-bold text-[#174d4b]">Teléfono <span className="font-normal text-[#62716d]">(opcional)</span></Label><Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="11 1234 5678" className="h-11 rounded-xl border-[#cbd8d3]" /></div></div>

            <div className="rounded-2xl bg-[#f7f0df] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#df4c2c]">Resumen</p><p className="mt-2 font-bold">{selectedUnit ? selectedUnit.label : 'Elegí una unidad'}</p><p className="mt-1 text-sm text-[#62716d]">{selectedPeriod.label}</p></div><p className="text-xl font-black">{selectedUnit ? currency.format(total) : '---'}</p></div><p className="mt-4 border-t border-[#dddbd1] pt-3 text-xs leading-relaxed text-[#62716d]">Importe orientativo de demo. No se cobra, no se reserva disponibilidad y no se guardan datos.</p></div>
            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
            <Button type="submit" disabled={!selectedUnit} className="h-11 w-full rounded-full bg-[#f0512d] font-black text-white hover:bg-[#dc4829]"><Check className="size-4" />Confirmar reserva local sin pagar</Button>
          </form>
        </section>
      </section>

      <section className="bg-[#174d4b] px-5 py-12 text-[#f8f5ed] sm:px-8 lg:px-12"><div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-3"><Info icon={<Waves className="size-5" />} title="A metros del agua" text="Primera línea y sectores con sombra para elegir cómo pasar el día." /><Info icon={<Users className="size-5" />} title="Para venir acompañado" text="Carpas hasta 6 personas y sombrillas hasta 4." /><Info icon={<LockKeyhole className="size-5" />} title="Una demo transparente" text="Nada de esta pantalla equivale a una reserva o cobro real." /></div></section>
    </main>
  );
}

function Header({ venueName }: { venueName: string }) {
  return <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12"><Link href="/" className="inline-flex items-center gap-2 text-sm font-black hover:text-[#f0512d]"><ArrowLeft className="size-4" /> Balne</Link><div className="text-right"><p className="font-serif text-xl font-black text-[#174d4b]">{venueName}</p><Link href="/login" className="text-xs font-bold text-[#526765] underline decoration-[#f0512d]/50 underline-offset-4 hover:text-[#f0512d]">Acceso para el equipo</Link></div></header>;
}

function StepTitle({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#174d4b] text-xs font-black text-[#fff3c7]">{number}</span><div><h2 className="text-2xl text-[#174d4b]">{title}</h2><p className="mt-1 text-sm text-[#62716d]">{text}</p></div></div>;
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="rounded-2xl border border-white/15 bg-white/5 p-5"><div className="text-[#f0cb91]">{icon}</div><h2 className="mt-5 text-xl">{title}</h2><p className="mt-2 text-sm leading-relaxed text-[#d2e4da]">{text}</p></article>;
}
