'use client';

import { FormEvent, use, useEffect, useState } from 'react';
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
import {
  createPublicReservation,
  getBalnearioBySlug,
  getPlanUnits,
  type BookingsBalneario,
  type BookingsPlanUnit,
  type PublicReservationInput,
} from '@/sdk/api/bookings-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export default function DynamicPublicBalnearioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [balneario, setBalneario] = useState<BookingsBalneario | null>(null);
  const [units, setUnits] = useState<BookingsPlanUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [selectedUnit, setSelectedUnit] = useState<BookingsPlanUnit | null>(null);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [guests, setGuests] = useState('2');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmedReservationId, setConfirmedReservationId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setFetchError('');
    Promise.all([getBalnearioBySlug(slug), getPlanUnits(slug)])
      .then(([bData, uData]) => {
        setBalneario(bData);
        setUnits(uData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load balneario:', err);
        setFetchError('No se encontró el balneario o el servicio no está disponible.');
        setLoading(false);
      });
  }, [slug]);

  function handleSelectUnit(unit: BookingsPlanUnit) {
    if (unit.status !== 'available' || !unit.is_rentable) return;
    setSelectedUnit(unit);
    setGuests(String(Math.min(2, unit.capacity)));
    setFormError('');
  }

  async function handleSubmitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUnit || !balneario) return;

    if (!name.trim() || !email.trim() || !email.includes('@')) {
      setFormError('Ingresá tu nombre y un email válido.');
      return;
    }

    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > selectedUnit.capacity) {
      setFormError(`La unidad admite entre 1 y ${selectedUnit.capacity} personas.`);
      return;
    }

    if (!startDate || !endDate || startDate >= endDate) {
      setFormError('La fecha de egreso debe ser posterior a la fecha de ingreso.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const input: PublicReservationInput = {
        unit_id: selectedUnit.id,
        start_date: startDate,
        end_date: endDate,
        guest_count: guestCount,
        total_price: 78000, // Referencia base
        notes,
        customer: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        },
      };

      const res = await createPublicReservation(slug, input);
      setConfirmedReservationId(res.id);
      setSubmitting(false);
    } catch (err) {
      console.error('Failed to create public reservation:', err);
      setFormError('Ocurrió un error al procesar la reserva. Por favor reintentá.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f7f0df] text-[#174d4b]">
        <div className="text-center">
          <Waves className="mx-auto size-10 animate-pulse text-[#398b87]" />
          <p className="mt-4 font-semibold">Cargando balneario…</p>
        </div>
      </main>
    );
  }

  if (fetchError || !balneario) {
    return (
      <main className="min-h-screen bg-[#f7f0df] px-5 py-12 text-[#174d4b] sm:px-8">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xl font-bold text-red-700">Balneario no encontrado</p>
          <p className="mt-3 text-sm text-slate-600">{fetchError || 'No se pudo obtener la información.'}</p>
          <Link href="/" className="mt-6 inline-flex h-10 items-center rounded-full bg-[#174d4b] px-6 text-sm font-bold text-white hover:bg-[#0e3b3a]">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  if (confirmedReservationId && selectedUnit) {
    return (
      <main className="min-h-screen bg-[#f7f0df] px-5 py-6 text-[#174d4b] sm:px-8 lg:px-12">
        <Header venueName={balneario.name} />
        <section className="mx-auto mt-12 max-w-2xl rounded-[2rem] border border-emerald-200 bg-white p-7 shadow-[0_22px_60px_rgba(23,77,75,0.12)] sm:p-10" role="status">
          <div className="grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-8" />
          </div>
          <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-[#df4c2c]">Reserva registrada</p>
          <h1 className="mt-3 text-4xl text-[#174d4b] sm:text-5xl">¡Tu reserva fue enviada con éxito!</h1>
          <p className="mt-5 text-lg leading-relaxed text-[#526765]">
            La reserva se registró en el sistema de {balneario.name}. El equipo del balneario se pondrá en contacto para coordinar el cobro y la confirmación.
          </p>
          <div className="mt-8 rounded-2xl bg-[#e6f2ed] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#52726e]">Código de reserva</p>
            <p className="mt-1 text-xl font-black tracking-wide text-[#174d4b]">{confirmedReservationId}</p>
            <p className="mt-4 text-sm text-[#365d58]">
              Unidad {selectedUnit.unit_number} (Zona {selectedUnit.zone}) · {startDate} al {endDate}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                setConfirmedReservationId(null);
                setSelectedUnit(null);
              }}
              className="rounded-full bg-[#174d4b] px-5 hover:bg-[#0e3b3a]"
            >
              Hacer otra reserva
            </Button>
            <Link href="/" className="inline-flex h-9 items-center rounded-full border border-[#174d4b]/20 px-5 text-sm font-bold hover:bg-[#f7f0df]">
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const availableUnits = units.filter((u) => u.is_rentable);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f0df] text-[#174d4b] selection:bg-[#f0512d] selection:text-white">
      <Header venueName={balneario.name} />

      <section className="relative overflow-hidden bg-[#ffe17b] px-5 pb-16 pt-12 sm:px-8 lg:px-12 lg:pb-20">
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#174d4b] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#fff3c7]">
              <Waves className="size-4" /> Frente al mar
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl leading-[0.96] sm:text-6xl lg:text-7xl">
              Tu día de playa empieza con un lugar elegido.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#345c58]">
              Elegí tu unidad en {balneario.name}, sobre {balneario.location}. Selección en tiempo real directa contra el balneario.
            </p>
          </div>
          <div className="rounded-[1.6rem] bg-[#174d4b] p-6 text-[#f8f5ed] shadow-[0_12px_0_#e9b936]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f0cb91]">Ubicación</p>
            <p className="mt-4 flex items-center gap-2 font-semibold">
              <MapPin className="size-4 text-[#f0cb91]" />
              {balneario.location}
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-[#d2e4da]">
              <Clock3 className="size-4 text-[#f0cb91]" />
              Temporada activa
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-16">
        <div>
          <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#174d4b] text-xs font-black text-[#fff3c7]">1</span>
            <div>
              <h2 className="text-2xl text-[#174d4b]">Elegí tu lugar</h2>
              <p className="mt-1 text-sm text-[#62716d]">Unidades disponibles en la base de datos de {balneario.name}.</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-[#174d4b]/15 bg-[#e7f1ed] p-4 shadow-[0_16px_40px_rgba(23,77,75,0.08)] sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-[#174d4b]/10 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df4c2c]">Plano de playa</p>
                <p className="mt-1 text-sm text-[#526765]">Línea del mar arriba</p>
              </div>
              <Waves className="size-7 text-[#398b87]" aria-hidden="true" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3" aria-label={`Unidades disponibles de ${balneario.name}`}>
              {availableUnits.map((unit) => {
                const isAvailable = unit.status === 'available';
                const isSelected = selectedUnit?.id === unit.id;
                return (
                  <button
                    key={unit.id}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleSelectUnit(unit)}
                    className={`min-h-36 rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 ${
                      isSelected
                        ? 'border-[#f0512d] bg-[#f0512d] text-white shadow-sm'
                        : isAvailable
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-950 hover:border-emerald-500 hover:bg-emerald-100'
                        : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <Umbrella className="size-5" />
                      <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-black uppercase">
                        {unit.status === 'available' ? 'Disponible' : 'Ocupada'}
                      </span>
                    </span>
                    <span className="mt-7 block font-bold">Unidad {unit.unit_number}</span>
                    <span className="mt-1 block text-xs opacity-80">Zona {unit.zone} · hasta {unit.capacity} personas</span>
                  </button>
                );
              })}
            </div>
            {availableUnits.length === 0 && (
              <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">No hay unidades cargadas en este balneario.</p>
            )}
          </div>
        </div>

        <section className="rounded-[1.75rem] border border-[#174d4b]/15 bg-white p-5 shadow-[0_16px_40px_rgba(23,77,75,0.08)] sm:p-7">
          <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#174d4b] text-xs font-black text-[#fff3c7]">2</span>
            <div>
              <h2 className="text-2xl text-[#174d4b]">Completá tu reserva</h2>
              <p className="mt-1 text-sm text-[#62716d]">Ingresá tus datos para registrar la reserva.</p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmitReservation}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="font-bold text-[#174d4b]">Fecha Ingreso</Label>
                <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date" className="font-bold text-[#174d4b]">Fecha Egreso</Label>
                <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guests" className="font-bold text-[#174d4b]">Personas</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                max={selectedUnit?.capacity ?? 10}
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold text-[#174d4b]">Nombre y Apellido</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Maria Gonzalez" className="h-11 rounded-xl" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-[#174d4b]">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@ejemplo.com" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-bold text-[#174d4b]">Teléfono</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11 1234 5678" className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="font-bold text-[#174d4b]">Notas o Preferencias</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Indicaciones para el equipo del balneario" className="h-11 rounded-xl" />
            </div>

            {formError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              disabled={!selectedUnit || submitting}
              className="h-11 w-full rounded-full bg-[#f0512d] font-black text-white hover:bg-[#dc4829]"
            >
              <Check className="size-4" />
              {submitting ? 'Registrando reserva…' : 'Enviar reserva'}
            </Button>
          </form>
        </section>
      </section>
    </main>
  );
}

function Header({ venueName }: { venueName: string }) {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-black hover:text-[#f0512d]">
        <ArrowLeft className="size-4" /> Balne
      </Link>
      <div className="text-right">
        <p className="font-serif text-xl font-black text-[#174d4b]">{venueName}</p>
        <Link href="/login" className="text-xs font-bold text-[#526765] underline hover:text-[#f0512d]">
          Acceso para el equipo
        </Link>
      </div>
    </header>
  );
}
