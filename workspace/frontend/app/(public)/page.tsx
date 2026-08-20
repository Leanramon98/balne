import type { Metadata } from 'next';
import Image from 'next/image';
import { LandingMotion } from './LandingMotion';
import {
  ArrowDown,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Instagram,
  MessageCircle,
  QrCode,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  Sun,
  UsersRound,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'El plano de tu balneario, vivo y en el bolsillo',
  description: 'Balne reúne reservas, cobros y control de acceso para balnearios de la Costa Atlántica.',
};

const features = [
  { icon: CalendarDays, title: 'Reservas y plano', description: 'Diarias, por semana, quincena o temporada completa.' },
  { icon: ReceiptText, title: 'Cobros y caja', description: 'Seña y saldo, cuotas, efectivo y Mercado Pago. Arqueo diario por usuario.' },
  { icon: UsersRound, title: 'Ficha de clientes', description: 'Historial de temporadas, lo que pagó y con quién viene cada año.' },
  { icon: QrCode, title: 'Check-in con QR', description: 'Cada reserva tiene su código. Sabés quién entra y cuántos son.' },
  { icon: MessageCircle, title: 'WhatsApp automático', description: 'Confirmaciones, recordatorios de cobro y avisos de cancelación.' },
  { icon: ClipboardCheck, title: 'Reportes', description: 'Ocupación, ingresos y comparación contra el verano anterior.' },
];

const plans = [
  ['Menos de 50', '2 días', '$150.000'],
  ['De 50 a 100', '3 días', '$225.000'],
  ['De 100 a 150', '4 días', '$300.000'],
  ['De 150 a 200', '5 días', '$375.000'],
  ['Más de 200', '6 días', '$450.000'],
];

const nextSeasonPlans = [
  ['Menos de 50', '½ día', '3 días', '$37.500', '$225.000'],
  ['De 50 a 100', '1 día', '4 días', '$75.000', '$300.000'],
  ['De 100 a 150', '1½ día', '5 días', '$112.500', '$375.000'],
  ['De 150 a 200', '2 días', '6 días', '$150.000', '$450.000'],
  ['Más de 200', '2½ días', '7 días', '$187.500', '$525.000'],
];

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Image
      src="/brand/balne-logo.png"
      alt="Balne, sistema de gestión para balnearios"
      width={3713}
      height={911}
      sizes="(min-width: 640px) 210px, 168px"
      className={`h-auto w-[168px] sm:w-[210px] ${inverse ? 'rounded-xl bg-[#fffaf0] p-2' : ''}`}
    />
  );
}

function UnavailableLogin({ className }: { className: string }) {
  return (
    <button
      type="button"
      disabled
      aria-describedby="login-unavailable"
      title="El acceso a la plataforma estará disponible próximamente."
      className={`cursor-not-allowed opacity-55 ${className}`}
    >
      Ingresar
    </button>
  );
}

function InstagramLink() {
  return (
    <a
      href="https://www.instagram.com/balne.ar"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Seguinos en Instagram: @balne.ar"
      className="grid size-9 place-items-center rounded-full text-[#174d4b] transition hover:bg-[#ffe8a1] hover:text-[#f0512d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174d4b]"
    >
      <Instagram className="size-5" aria-hidden="true" />
    </a>
  );
}

function PlanGrid({ interactive = false }: { interactive?: boolean }) {
  const units = Array.from({ length: 30 }, (_, index) => index);
  return (
    <div className="relative rounded-[1.7rem] border border-[#1d5c5c]/15 bg-[#f8f5ed] p-4 shadow-[0_20px_50px_rgba(14,53,53,0.14)] sm:p-6">
      <div className="mb-5 flex items-center justify-between rounded-xl bg-[#195653] px-4 py-3 text-sm font-bold text-[#f7f0df]">
        <span>{interactive ? 'BALNEARIO LOS PINOS' : 'Plano del balneario'}</span>
        {!interactive && <span className="text-[#edc889]">82% ocupado</span>}
      </div>
      {interactive && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#6c7068]">Elegí tu día</p>}
      {interactive && <div className="mb-5 rounded-lg border border-[#d8d1c4] bg-white px-3 py-2 text-sm font-medium text-[#253e3d]">Sábado 16 de enero</div>}
      <div className="relative mb-5 grid grid-cols-6 gap-2 sm:gap-3" aria-label="Plano ilustrativo de carpas">
        {units.map((unit) => {
          const selected = interactive && unit === 14;
          const occupied = [1, 4, 7, 9, 13, 17, 22, 25, 28].includes(unit);
          return (
            <span
              key={unit}
              className={`aspect-[1.25] rounded-[0.45rem] border transition-transform ${selected ? 'border-[#d94224] bg-[#f0512d] shadow-[0_4px_0_#bd351e]' : occupied ? 'border-[#d5cdbf] bg-[#d7d0c2]' : 'border-[#246763] bg-[#4b8a85]'}`}
            />
          );
        })}
        <div className="col-span-6 mt-1 h-5 rounded-full bg-[#b6dbd8]" aria-hidden="true" />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-[#5e6762]">
        <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-sm bg-[#4b8a85]" />Libre</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-sm bg-[#d7d0c2]" />Ocupada</span>
        {interactive && <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-sm bg-[#f0512d]" />Tu elección</span>}
      </div>
      {interactive ? (
        <div className="mt-5 rounded-xl bg-[#ede8dd] p-3 text-sm font-semibold text-[#1d4e4c]">Carpa 32 · segunda fila <span className="float-right">$75.000</span></div>
      ) : (
        <p className="mt-5 text-sm font-semibold italic text-[#286662]">Tocás una carpa y reservás</p>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="overflow-x-clip bg-[#fffaf0] font-sans text-[#174d4b] selection:bg-[#f0512d] selection:text-white">
      <LandingMotion />
      <span id="login-unavailable" className="sr-only">El acceso a la plataforma estará disponible próximamente.</span>
      <div className="bg-[#f0512d] px-5 py-2.5 text-center text-sm font-bold text-white sm:px-8">
        <a href="#fundadores" className="inline-flex items-center gap-2 underline decoration-white/50 underline-offset-4 hover:decoration-white">Temporada 2026 / 2027: conocé el programa para balnearios fundadores <ArrowUpRight className="size-4" /></a>
      </div>
      <header className="sticky top-0 z-50 border-b border-[#174d4b]/10 bg-[#fffaf0]/95 shadow-[0_8px_24px_rgba(14,53,53,0.1)] backdrop-blur-md">
          <div className="mx-auto hidden max-w-7xl items-center justify-between px-5 py-3 text-xs font-bold text-[#506c68] sm:flex sm:px-8 lg:px-12">
            <span>Sistema de gestión para balnearios de la Costa Atlántica</span>
            <div className="flex items-center gap-5"><a href="#precio" className="hover:text-[#f0512d]">Abono</a><a href="#fundadores" className="hover:text-[#f0512d]">Fundadores</a><UnavailableLogin className="hover:text-[#f0512d]" /></div>
          </div>
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12" aria-label="Navegación principal">
            <Brand />
            <div className="hidden items-center gap-7 text-sm font-black lg:flex"><a href="#como-funciona" className="hover:text-[#f0512d]">Cómo funciona</a><a href="#incluye" className="hover:text-[#f0512d]">Qué incluye</a><a href="#precio" className="hover:text-[#f0512d]">Precios</a><a href="#fundadores" className="hover:text-[#f0512d]">Fundadores</a><UnavailableLogin className="rounded-full bg-[#174d4b] px-5 py-2.5 text-white" /><InstagramLink /></div>
            <div className="flex items-center gap-1 lg:hidden"><InstagramLink /><details className="group"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[#174d4b]/20 px-4 py-2 text-sm font-black">Menú <ChevronDown className="size-4 transition group-open:rotate-180" /></summary><div className="absolute right-5 top-[calc(100%-0.5rem)] w-56 rounded-2xl border border-[#174d4b]/10 bg-[#fffaf0] p-3 shadow-xl sm:right-8"><a href="#como-funciona" className="block rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-[#ffe8a1]">Cómo funciona</a><a href="#incluye" className="block rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-[#ffe8a1]">Qué incluye</a><a href="#precio" className="block rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-[#ffe8a1]">Precios</a><a href="#fundadores" className="block rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-[#ffe8a1]">Fundadores</a><UnavailableLogin className="mt-2 block w-full rounded-lg bg-[#174d4b] px-3 py-2.5 text-center text-sm font-bold text-white" /></div></details></div>
        </nav>
      </header>
      <section className="relative isolate overflow-hidden bg-[#ffe17b] px-5 pb-20 pt-14 sm:px-8 lg:px-12 lg:pb-28 lg:pt-20">
        <div className="landing-sun-halo absolute -left-20 top-8 size-72 rounded-full bg-[#fff2bd]" aria-hidden="true" />
        <Sun className="landing-sun absolute right-[9%] top-10 size-36 text-[#f5b627] opacity-80 sm:size-52" strokeWidth={1} aria-hidden="true" />
        <div className="landing-sea absolute inset-x-0 bottom-0 h-24 overflow-hidden" aria-hidden="true">
          <div className="landing-wave landing-wave-back" />
          <div className="landing-wave landing-wave-mid" />
          <div className="landing-wave landing-wave-front" />
          <div className="landing-shoreline" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="landing-reveal mb-5 inline-flex items-center gap-2 rounded-full bg-[#174d4b] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#fff3c7]">Temporada 2026 / 2027</p>
            <h1 className="landing-reveal landing-reveal-delay-1 max-w-3xl font-serif text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-6xl lg:text-8xl">El plano de tu balneario, <span className="text-[#e84826]">vivo</span> y en el bolsillo.</h1>
            <p className="landing-reveal landing-reveal-delay-2 mt-7 max-w-xl text-lg leading-relaxed text-[#345c58] sm:text-xl">Reservas, cobros y control de acceso en un solo lugar. Una propuesta para balnearios de la Costa Atlántica.</p>
            <div className="landing-reveal landing-reveal-delay-3 mt-9 flex flex-wrap gap-3">
              <a href="#fundadores" className="inline-flex items-center gap-2 rounded-full bg-[#f0512d] px-6 py-3.5 text-sm font-black text-white shadow-[0_5px_0_#b9341e] transition hover:-translate-y-0.5 hover:bg-[#ff5b36] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Conocé Balnearios fundadores <ArrowUpRight className="size-4" /></a>
              <a href="#precio" className="inline-flex items-center gap-2 rounded-full border border-[#174d4b]/25 px-5 py-3.5 text-sm font-bold transition hover:bg-[#fff4ca]">Ver abono <ArrowDown className="size-4" /></a>
            </div>
          </div>
          <div className="landing-reveal landing-reveal-delay-2 relative mx-auto w-full max-w-md lg:translate-y-8">
            <div className="absolute -bottom-7 -left-8 size-24 rounded-full bg-[#f0512d] sm:size-32" aria-hidden="true" />
            <div className="relative rotate-[2deg] rounded-[2rem] bg-[#fffaf0] p-3 shadow-[0_18px_0_#f5b627] sm:p-5"><PlanGrid /></div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="landing-parallax landing-drift absolute right-[7%] top-16 size-20 rounded-full border-[10px] border-[#ffe17b]/60" aria-hidden="true" />
        <p className="landing-observe text-xs font-black uppercase tracking-[0.2em] text-[#dc4829]">La información no puede vivir en una sola cabeza</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <h2 className="landing-observe font-serif text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl">El verano se gestiona en movimiento.</h2>
          <p className="landing-observe max-w-2xl text-lg leading-relaxed text-[#546765]">Cuando el plano está en papel, la renovación se hace a mano y la caja no tiene trazabilidad, la operación depende de una sola persona. Balne reúne esa información en una pantalla compartida.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ['01', 'El plano en papel', 'Una hoja plastificada en el mostrador. Si el encargado no está, nadie sabe qué carpa está libre.'],
            ['02', 'Renovación a mano', 'WhatsApps uno por uno entre septiembre y noviembre para confirmar quién sigue.'],
            ['03', 'La caja sin control', 'Cobros en efectivo, sin registro de quién cobró qué. La fuga aparece recién al cerrar la temporada.'],
          ].map(([number, title, description]) => (
          <article key={number} className="landing-observe landing-card rounded-[1.6rem] border border-[#ded6c7] bg-[#eee9df] p-7 shadow-[0_10px_25px_rgba(34,62,57,0.04)]">
              <span className="grid size-11 place-items-center rounded-full bg-[#195653] font-serif text-lg font-bold text-[#f8f5ed]">{number}</span>
              <h3 className="mt-10 font-serif text-2xl font-black tracking-[-0.03em]">{title}</h3>
              <p className="mt-4 leading-relaxed text-[#576561]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="relative scroll-mt-40 sm:scroll-mt-44 bg-[#d8f0e3] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="landing-parallax landing-drift absolute left-[5%] top-20 size-24 rounded-full bg-[#ffe17b]/70" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
          <div className="landing-observe">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#dc4829]">Qué es Balne</p>
            <h2 className="mt-4 font-serif text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl">Tu mismo plano, pero vivo y compartido.</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#526765]">Balne reemplaza el plano de papel, la planilla y el cuaderno por una sola pantalla que todos ven al mismo tiempo. Desde ahí reservás, cobrás y controlás quién entra.</p>
            <div className="mt-9 space-y-6">
              {[
                ['Es tu plano, no uno nuevo', 'Cargamos el plano de tu balneario con tus mismos números de carpa y tu misma distribución.'],
                ['Todos ven lo mismo', 'Mostrador, encargado y dueño miran la misma ocupación, actualizada al segundo.'],
                ['Funciona en la arena', 'Pensado para celular y para señal mala, que es donde se trabaja de verdad.'],
              ].map(([title, description]) => (
                <div key={title} className="flex gap-4"><span className="mt-1.5 size-3 shrink-0 rounded-full bg-[#f0512d] shadow-[0_0_0_6px_rgba(240,81,45,0.14)]" /><div><h3 className="font-serif text-xl font-black">{title}</h3><p className="mt-1 leading-relaxed text-[#526765]">{description}</p></div></div>
              ))}
            </div>
          </div>
          <div className="landing-observe landing-card mx-auto w-full max-w-lg rotate-[2deg]"><PlanGrid /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="landing-observe landing-card order-2 mx-auto w-full max-w-md -rotate-[2deg] lg:order-1"><PlanGrid interactive /></div>
          <div className="landing-observe order-1 lg:order-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#dc4829]">Lo que ve tu cliente</p>
            <h2 className="mt-4 font-serif text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl">Con tu marca, tu plano y tu cuenta de cobro.</h2>
            <ol className="mt-9 space-y-7">
              {[
                ['Entra a tu página, no a la nuestra', 'El turista ve el nombre y el logo de tu balneario. Balne no aparece por ningún lado.'],
                ['Elige su carpa en el plano', 'Ve exactamente qué lugar está tomando y a qué distancia del agua.'],
                ['Paga y queda confirmado', 'El dinero entra a tu cuenta, le llega el comprobante por WhatsApp y la carpa se marca sola en tu plano.'],
              ].map(([title, description], index) => (
                <li key={title} className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#195653] text-sm font-black text-[#f8f5ed]">{index + 1}</span><div><h3 className="font-serif text-xl font-black">{title}</h3><p className="mt-1 leading-relaxed text-[#526765]">{description}</p></div></li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="incluye" className="scroll-mt-40 sm:scroll-mt-44 bg-[#174d4b] px-5 py-20 text-[#f8f5ed] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="landing-observe text-xs font-black uppercase tracking-[0.2em] text-[#f0cb91]">Todo lo que entra en el abono</p>
          <div className="landing-observe mt-4 flex flex-wrap items-end justify-between gap-5"><h2 className="max-w-2xl font-serif text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl">Sin módulos escondidos ni sorpresas a mitad de temporada.</h2><p className="max-w-md text-[#cae0d8]">Herramientas para operar el balneario desde una misma pantalla.</p></div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => <article key={title} className="landing-observe landing-card rounded-[1.35rem] border border-[#6ca19a]/45 bg-[#286663] p-6"><Icon className="size-6 text-[#f0cb91]" /><h3 className="mt-8 font-serif text-2xl font-black">{title}</h3><p className="mt-3 leading-relaxed text-[#d5e5df]">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="precio" className="scroll-mt-40 sm:scroll-mt-44 mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div className="landing-observe landing-card rounded-[2rem] bg-[#f0512d] p-8 text-white shadow-[0_16px_0_#c83c22] sm:p-10"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffe1b2]">El precio se mide en carpas</p><p className="mt-7 font-serif text-7xl font-black tracking-[-0.08em]">2 a 6</p><p className="mt-4 text-xl font-bold leading-snug">días de tu tarifa de carpa, por mes de enero y febrero</p><p className="mt-8 text-[#ffe6c4]">Cuánto exactamente depende del tamaño del balneario.</p></div>
          <div className="landing-observe"><h2 className="font-serif text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl">Abono temporada 2026 / 2027</h2><p className="mt-4 text-lg text-[#586663]">Precio de lanzamiento, expresado en días de tu tarifa de carpa full de enero.</p><div className="mt-7 overflow-hidden rounded-2xl border border-[#d9d1c3] bg-white"><div className="grid grid-cols-[1.3fr_0.7fr_0.75fr] bg-[#174d4b] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#e7eee8]"><span>Unidades de sombra</span><span>Por mes</span><span>Ejemplo*</span></div>{plans.map(([range, days, price]) => <div key={range} className="grid grid-cols-[1.3fr_0.7fr_0.75fr] border-t border-[#e5ded2] px-5 py-3.5 text-sm sm:text-base"><span className="font-bold">{range}</span><span>{days}</span><span className="font-black text-[#174d4b]">{price}</span></div>)}</div><p className="mt-4 text-sm italic text-[#62716d]">* Ejemplo con carpa full de enero a $75.000. El módulo de preventa y renovación se incorpora en la temporada 2027 / 2028.</p></div>
        </div>
        <div className="landing-observe landing-card mt-16 rounded-[2rem] bg-[#174d4b] p-7 text-[#fffaf0] sm:p-10"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffe17b]">Precio de lista 2027 / 2028</p><div className="mt-4 flex flex-wrap items-end justify-between gap-4"><h2 className="max-w-2xl font-serif text-3xl font-black leading-tight sm:text-4xl">La próxima temporada incluye preventa y renovación.</h2><p className="max-w-md text-[#d2e4da]">De marzo a agosto, sin costo. El tramo de septiembre a diciembre suma el módulo de renovación.</p></div><div className="mt-8 overflow-x-auto rounded-2xl bg-[#fffaf0] text-[#174d4b]"><table className="min-w-[720px] w-full text-left text-sm"><thead className="bg-[#ffefba] text-xs uppercase tracking-wider"><tr><th className="p-4">Unidades</th><th className="p-4">Sep a dic</th><th className="p-4">Ene / Feb</th><th className="p-4">Ejemplo Sep a dic*</th><th className="p-4">Ejemplo Ene / Feb*</th></tr></thead><tbody>{nextSeasonPlans.map(([range, fall, summer, fallPrice, summerPrice]) => <tr key={range} className="border-t border-[#174d4b]/10"><td className="p-4 font-bold">{range}</td><td className="p-4">{fall}</td><td className="p-4">{summer}</td><td className="p-4 font-bold">{fallPrice}</td><td className="p-4 font-bold">{summerPrice}</td></tr>)}</tbody></table></div><p className="mt-4 text-sm text-[#d2e4da]">* Ejemplo con carpa full de enero a $75.000.</p></div>
      </section>

      <section className="relative bg-[#e9e3d8] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><div className="landing-parallax landing-drift absolute right-[6%] top-16 size-16 rounded-full border-8 border-[#f0512d]/25" aria-hidden="true" /><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div className="landing-observe"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#dc4829]">La próxima temporada</p><h2 className="mt-4 font-serif text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl">Preventa y renovación de temporada.</h2><p className="mt-6 max-w-xl text-lg leading-relaxed text-[#526765]">El tramo de septiembre a diciembre del precio de lista incluye el módulo que resuelve la renovación de tus habitués.</p><ol className="mt-8 space-y-4">{['Mandás el link de renovación a todos los clientes de la temporada pasada, de una sola vez.', 'Cada uno confirma su misma carpa y paga la seña desde el celular.', 'Lo que no se renovó antes de la fecha límite se libera solo a la venta general.'].map((item, index) => <li key={item} className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#195653] font-black text-[#f8f5ed]">{index + 1}</span><span className="pt-1 leading-relaxed text-[#314e4c]">{item}</span></li>)}</ol></div><aside className="landing-observe landing-card rounded-[2rem] bg-[#195653] p-9 text-[#f8f5ed] shadow-[0_16px_0_#bfb7a9]"><BadgeCheck className="size-10 text-[#f0cb91]" /><p className="mt-10 text-xs font-black uppercase tracking-[0.2em] text-[#f0cb91]">Hoy, a mano</p><p className="mt-4 font-serif text-4xl font-black leading-tight tracking-[-0.04em]">Es el momento del año en que más podés facturar.</p></aside></div></section>

      <section className="relative bg-[#195653] px-5 py-20 text-[#f8f5ed] sm:px-8 lg:px-12 lg:py-28"><div className="landing-wave-divider" aria-hidden="true" /><div className="mx-auto max-w-7xl"><div className="landing-observe"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#f0cb91]">El acuerdo es claro</p><h2 className="mt-4 font-serif text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl">Cero comisión sobre tus ventas.</h2><p className="mt-5 text-lg text-[#d0e2dc]">Vendés lo que vendés. El abono es el mismo.</p></div><div className="mt-12 grid gap-4 md:grid-cols-3">{[[ShieldCheck, 'Tus clientes son tuyos', 'La base de datos de tus habitués es tuya y te la llevás cuando quieras, en un archivo.'], [CircleDollarSign, 'Cobrás vos, directo', 'El dinero de las reservas va a tu cuenta de Mercado Pago. No pasa por la nuestra.'], [ScanLine, 'Un solo número al año', 'Sabés en agosto cuánto vas a pagar en febrero. Sin liquidaciones ni sorpresas.']].map(([Icon, title, description]) => { const FeatureIcon = Icon as typeof ShieldCheck; return <article key={title as string} className="landing-observe landing-card rounded-[1.5rem] bg-[#2d6a66] p-7"><FeatureIcon className="size-7 text-[#f0cb91]" /><h3 className="mt-8 font-serif text-2xl font-black">{title as string}</h3><p className="mt-3 leading-relaxed text-[#d8e6e0]">{description as string}</p></article>; })}</div></div></section>

      <section id="fundadores" className="scroll-mt-40 sm:scroll-mt-44 mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><div className="landing-observe"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#dc4829]">Temporada 2026 / 2027</p><h2 className="mt-4 font-serif text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl">Balnearios fundadores.</h2><p className="mt-4 text-lg text-[#586663]">Un grupo chico para la primera temporada.</p></div><div className="mt-12 grid gap-4 lg:grid-cols-2"><article className="landing-observe landing-card rounded-[1.75rem] bg-[#eee9df] p-8"><h3 className="font-serif text-3xl font-black">Lo que recibís</h3><ul className="mt-7 space-y-4 text-[#415957]">{['Precio de lanzamiento congelado toda la temporada.', 'Carga del plano y del padrón de clientes, hecha por nosotros.', 'Soporte directo por WhatsApp durante todo el verano.', 'Si en enero no te sirve, dejás de pagar. Sin permanencia.'].map(item => <li key={item} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-[#dc4829]" />{item}</li>)}</ul></article><article className="landing-observe landing-card rounded-[1.75rem] border border-[#d7cfc1] bg-white p-8"><h3 className="font-serif text-3xl font-black">Lo que te pedimos</h3><ul className="mt-7 space-y-4 text-[#415957]">{['Cinco minutos por semana durante la temporada para contarnos cómo viene.', 'Que podamos contar tu caso cuando hablemos con otros balnearios.'].map(item => <li key={item} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-[#dc4829]" />{item}</li>)}</ul></article></div></section>

      <footer className="relative bg-[#f0512d] px-5 pb-8 pt-16 text-white sm:px-8 lg:px-12"><div className="landing-wave-divider landing-wave-divider-light" aria-hidden="true" /><div className="mx-auto max-w-7xl"><div className="landing-observe grid gap-12 border-b border-white/25 pb-14 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr]"><div><Brand inverse /><h2 className="mt-7 max-w-lg font-serif text-5xl font-black leading-none tracking-[-0.05em]">¿Empezamos?</h2><p className="mt-4 max-w-md text-lg text-[#ffe6c4]">Reservas, cobros y control de acceso en un solo lugar.</p><a href="#fundadores" className="landing-cta mt-7 inline-flex items-center gap-2 rounded-full bg-[#fffaf0] px-6 py-3.5 text-sm font-black text-[#174d4b] transition hover:bg-[#ffe17b]">Conocé el programa <ArrowUpRight className="size-4" /></a></div><div><h3 className="text-sm font-black uppercase tracking-[0.16em] text-[#ffe4ae]">Explorá</h3><div className="mt-5 grid gap-3 text-sm font-bold"><a href="#como-funciona" className="hover:underline">Cómo funciona</a><a href="#incluye" className="hover:underline">Qué incluye</a><a href="#precio" className="hover:underline">Precios</a></div></div><div><h3 className="text-sm font-black uppercase tracking-[0.16em] text-[#ffe4ae]">Para tu balneario</h3><div className="mt-5 grid gap-3 text-sm font-bold"><a href="#fundadores" className="hover:underline">Fundadores</a><a href="#precio" className="hover:underline">Preventa y renovación</a><UnavailableLogin className="w-fit hover:underline" /></div></div><div><h3 className="text-sm font-black uppercase tracking-[0.16em] text-[#ffe4ae]">Balne</h3><p className="mt-5 text-sm leading-relaxed text-[#ffe6c4]">Sistema de gestión para balnearios de la Costa Atlántica.</p><p className="mt-4 text-sm font-bold">www.balne.com.ar</p></div></div><div className="landing-observe flex flex-wrap items-center justify-between gap-3 pt-7 text-xs font-bold text-[#ffe1bc]"><span>Balne · Temporada 2026 / 2027</span><span>Hecho para trabajar donde pasa el verano.</span></div></div></footer>
      <style>{`
        @keyframes landing-reveal {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes landing-sunrise {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-28px) rotate(5deg); }
        }
        @keyframes landing-sun-glow {
          0%, 100% { opacity: 0.62; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.09); }
        }
        @keyframes landing-swell {
          0%, 100% { transform: translate3d(-6%, 4px, 0) scaleY(0.96); }
          50% { transform: translate3d(6%, -15px, 0) scaleY(1.08); }
        }
        @keyframes landing-divider {
          0%, 100% { background-position-x: 0; }
          50% { background-position-x: 72px; }
        }
        @keyframes landing-drift-glow {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .landing-reveal { animation: landing-reveal 820ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .landing-reveal-delay-1 { animation-delay: 130ms; }
        .landing-reveal-delay-2 { animation-delay: 260ms; }
        .landing-reveal-delay-3 { animation-delay: 390ms; }
        .landing-sun { animation: landing-sunrise 5.5s ease-in-out infinite; }
        .landing-sun-halo { animation: landing-sun-glow 7.5s ease-in-out infinite; }
        .landing-parallax {
          transform: translate3d(0, var(--landing-parallax-y, 0px), 0);
          will-change: transform;
        }
        .landing-drift { animation: landing-drift-glow 9s ease-in-out infinite; }
        .landing-wave-divider {
          position: absolute;
          inset: -1px 0 auto;
          height: 22px;
          background: radial-gradient(28px 13px at 50% 100%, transparent 68%, #e9e3d8 70%) 0 0 / 72px 22px repeat-x;
          animation: landing-divider 12s linear infinite;
          pointer-events: none;
        }
        .landing-wave-divider-light {
          background-image: radial-gradient(28px 13px at 50% 100%, transparent 68%, #fffaf0 70%);
        }
        .landing-card {
          transition: translate 340ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 340ms ease, border-color 340ms ease;
        }
        .landing-card:hover {
          translate: 0 -10px;
          border-color: rgba(240, 81, 45, 0.7);
          box-shadow: 0 24px 42px rgba(14, 53, 53, 0.2);
        }
        .landing-card:focus-within {
          translate: 0 -7px;
          border-color: rgba(240, 81, 45, 0.7);
        }
        .landing-cta:hover { translate: 0 -5px; box-shadow: 0 10px 0 rgba(128, 43, 26, 0.3); }
        .landing-cta:focus-visible { outline: 2px solid #fffaf0; outline-offset: 4px; }
        @media (prefers-reduced-motion: no-preference) {
          .landing-motion-ready .landing-observe {
            opacity: 0;
            transform: translate3d(0, 36px, 0);
            transition: opacity 720ms ease, transform 820ms cubic-bezier(0.22, 1, 0.36, 1);
          }
         .landing-motion-ready .landing-observe.landing-visible { opacity: 1; transform: translate3d(0, 0, 0); }
         .landing-motion-ready footer .landing-observe:last-child { opacity: 1; transform: none; }
         .landing-motion-ready .landing-card:nth-child(2) { transition-delay: 90ms; }
          .landing-motion-ready .landing-card:nth-child(3) { transition-delay: 180ms; }
          .landing-motion-ready .landing-card:nth-child(4) { transition-delay: 270ms; }
          .landing-motion-ready .landing-card:nth-child(5) { transition-delay: 360ms; }
          .landing-motion-ready .landing-card:nth-child(6) { transition-delay: 450ms; }
        }
        .landing-sea { pointer-events: none; }
        .landing-wave {
          position: absolute;
          left: -10%;
          width: 120%;
          border-radius: 50% 50% 0 0 / 34px 34px 0 0;
          will-change: transform;
        }
        .landing-wave-back {
          bottom: 23px;
          height: 54px;
          background: #9bd6d0;
          animation: landing-swell 12s ease-in-out infinite;
        }
        .landing-wave-mid {
          bottom: 12px;
          height: 48px;
          background: #5faea9;
          animation: landing-swell 9s ease-in-out -3s infinite reverse;
        }
        .landing-wave-front {
          bottom: 5px;
          height: 39px;
          background: #c9e8dc;
          animation: landing-swell 7s ease-in-out -1.5s infinite;
        }
        .landing-shoreline {
          position: absolute;
          inset: auto -5% 0;
          height: 13px;
          border-radius: 50% 50% 0 0 / 12px 12px 0 0;
          background: #fffaf0;
        }
        @media (prefers-reduced-motion: reduce) {
          .landing-reveal, .landing-sun, .landing-sun-halo, .landing-wave, .landing-drift, .landing-wave-divider { animation: none; }
          .landing-parallax { transform: none; }
          .landing-card, .landing-cta { transition: none; }
          *, *::before, *::after { scroll-behavior: auto !important; }
        }
      `}</style>
    </main>
  );
}
