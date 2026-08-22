'use client';

import { useId, useState } from 'react';

// Brand Palette Tokens
const BRAND = {
  petrol: '#2F595A', // Dominante (fondos oscuros y texto)
  orange: '#E24225', // Acento, CTA, número principal sobre fondo claro
  sand: '#E8C9A0',   // Acento sobre fondos oscuros
  cream: '#FCEFDE',  // Tarjeta / acento claro
  lightBeige: '#F2EDE4', // Fondo de sección
  ink: '#2A2622',    // Texto sobre fondo claro
};

function formatPesos(amount: number): string {
  const rounded = Math.round(amount);
  return '$' + rounded.toLocaleString('es-AR');
}

function formatDays(days: number): string {
  if (days === 1) return '1 día';
  if (days === 0.5) return '0,5 días';
  if (days === 1.5) return '1,5 días';
  if (days === 2.5) return '2,5 días';
  const str = days % 1 === 0 ? days.toString() : days.toLocaleString('es-AR');
  return `${str} días`;
}

// Calculate days per installment for Enero & Febrero (una cuota por mes, 2 cuotas en total)
function getDiasEneFeb(units: number): number {
  if (units < 50) return 0.5;   // 1 día total de verano
  if (units <= 100) return 1.5;  // 3 días total de verano (ej: 100 carpas @ $100k = 2 cuotas de $150k)
  if (units <= 150) return 2.0;  // 4 días total de verano
  if (units <= 200) return 2.5;  // 5 días total de verano
  return 3.0;                    // 6 días total de verano (201 o más)
}

// Calculate days per installment for Septiembre a Diciembre (4 cuotas en total)
function getDiasSepDic(units: number): number {
  return units <= 150 ? 0.5 : 1.0;
}

export function PricingCalculator() {
  const [units, setUnits] = useState<number>(100);
  const [tentRate, setTentRate] = useState<number>(75000);
  const [rawRateInput, setRawRateInput] = useState<string>('75.000');

  const unitsSliderId = useId();
  const unitsInputId = useId();
  const rateSliderId = useId();
  const rateInputId = useId();

  // Calculations
  const diasEneFeb = getDiasEneFeb(units);
  const diasSepDic = getDiasSepDic(units);

  const cuotaEneFeb = diasEneFeb * tentRate;
  const cuotaSepDic = diasSepDic * tentRate;

  // Temporada 2026/2027 (Septiembre a Diciembre bonificado)
  const total2627 = cuotaEneFeb * 2;
  const diasTotales2627 = diasEneFeb * 2;
  const bonificado2627 = cuotaSepDic * 4;

  // Temporada 2027/2028 (Precio de lista completo)
  const total2728 = cuotaSepDic * 4 + cuotaEneFeb * 2;
  const diasTotales2728 = diasSepDic * 4 + diasEneFeb * 2;

  // Handlers for Units
  const handleUnitsChange = (val: number) => {
    const clamped = Math.max(10, Math.min(400, val));
    setUnits(clamped);
  };

  // Handlers for Rate
  const handleRateChange = (val: number) => {
    const clamped = Math.max(20000, Math.min(300000, val));
    setTentRate(clamped);
    setRawRateInput(clamped.toLocaleString('es-AR'));
  };

  const handleRateInputBlur = () => {
    // Parse cleaned number string
    const cleaned = rawRateInput.replace(/[^0-9]/g, '');
    let parsed = parseInt(cleaned, 10);
    if (isNaN(parsed)) parsed = 75000;
    const clamped = Math.max(20000, Math.min(300000, parsed));
    setTentRate(clamped);
    setRawRateInput(clamped.toLocaleString('es-AR'));
  };

  return (
    <section
      id="calculadora-precios"
      aria-label="Calculadora de precios Balne"
      className="rounded-[2.5rem] border border-[#2F595A]/15 bg-[#F2EDE4] p-6 text-[#2A2622] shadow-[0_20px_50px_rgba(47,89,90,0.08)] sm:p-10 lg:p-12"
      style={{ backgroundColor: BRAND.lightBeige, color: BRAND.ink }}
    >
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <div className="text-center sm:text-left">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E24225]">
            Calculadora interactiva
          </p>
          <h2 className="mt-2 font-serif text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl md:text-5xl text-[#2F595A]">
            Calculá el abono de tu balneario en pesos.
          </h2>
          <p className="mt-3 max-w-2xl text-base sm:text-lg leading-relaxed text-[#2F595A]/80">
            En Balne el abono se mide en días de tu propia tarifa de carpa full de enero. Mové los controles para ver el importe exacto según tu balneario.
          </p>
        </div>

        {/* Inputs Grid */}
        <div className="grid gap-8 rounded-3xl bg-white p-6 shadow-sm border border-[#2F595A]/10 sm:p-8 md:grid-cols-2">
          {/* Input 1: Shade Units */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor={unitsInputId}
                className="text-sm font-bold text-[#2F595A]"
              >
                Unidades de sombra <span className="text-xs font-normal text-[#2A2622]/70">(carpas + sombrillas)</span>
              </label>
              <div className="flex items-center gap-1 rounded-xl bg-[#FCEFDE] px-3 py-1.5 border border-[#2F595A]/15">
                <input
                  id={unitsInputId}
                  type="number"
                  min={10}
                  max={400}
                  step={5}
                  value={units}
                  onChange={(e) => handleUnitsChange(Number(e.target.value))}
                  className="w-16 bg-transparent text-right font-serif text-lg font-black text-[#2F595A] outline-none focus:ring-2 focus:ring-[#E24225] rounded-md"
                  aria-label="Cantidad editable de unidades de sombra"
                />
                <span className="text-xs font-bold text-[#2F595A]">unid.</span>
              </div>
            </div>

            <input
              id={unitsSliderId}
              type="range"
              min={10}
              max={400}
              step={5}
              value={units}
              onChange={(e) => handleUnitsChange(Number(e.target.value))}
              aria-label="Deslizador de unidades de sombra"
              aria-valuemin={10}
              aria-valuemax={400}
              aria-valuenow={units}
              aria-valuetext={`${units} unidades de sombra`}
              className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-[#F2EDE4] accent-[#E24225] focus:outline-none focus:ring-2 focus:ring-[#E24225]"
            />

            <div className="flex justify-between text-xs font-bold text-[#2F595A]/60">
              <span>10 unid.</span>
              <span>200 unid.</span>
              <span>400 unid.</span>
            </div>
          </div>

          {/* Input 2: Tent Rate */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor={rateInputId}
                className="text-sm font-bold text-[#2F595A]"
              >
                Tarifa carpa full en enero <span className="text-xs font-normal text-[#2A2622]/70">($ por día)</span>
              </label>
              <div className="flex items-center gap-1 rounded-xl bg-[#FCEFDE] px-3 py-1.5 border border-[#2F595A]/15">
                <span className="text-sm font-black text-[#2F595A]">$</span>
                <input
                  id={rateInputId}
                  type="text"
                  inputMode="numeric"
                  value={rawRateInput}
                  onChange={(e) => setRawRateInput(e.target.value)}
                  onBlur={handleRateInputBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRateInputBlur();
                  }}
                  className="w-24 bg-transparent text-right font-serif text-lg font-black text-[#2F595A] outline-none focus:ring-2 focus:ring-[#E24225] rounded-md"
                  aria-label="Tarifa editable de carpa full en enero"
                />
              </div>
            </div>

            <input
              id={rateSliderId}
              type="range"
              min={20000}
              max={300000}
              step={5000}
              value={tentRate}
              onChange={(e) => handleRateChange(Number(e.target.value))}
              aria-label="Deslizador de tarifa de carpa full en enero"
              aria-valuemin={20000}
              aria-valuemax={300000}
              aria-valuenow={tentRate}
              aria-valuetext={`$${tentRate.toLocaleString('es-AR')} por día`}
              className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-[#F2EDE4] accent-[#E24225] focus:outline-none focus:ring-2 focus:ring-[#E24225]"
            />

            <div className="flex justify-between text-xs font-bold text-[#2F595A]/60">
              <span>$20.000</span>
              <span>$160.000</span>
              <span>$300.000</span>
            </div>
          </div>
        </div>

        {/* Output 1: Tarjeta chica y siempre visible (Mecanismo traducido) */}
        <div
          aria-live="polite"
          className="rounded-2xl border border-[#2F595A]/20 bg-[#FCEFDE] p-5 shadow-sm sm:p-6 transition-all duration-200"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h3 className="font-serif text-2xl font-black text-[#2F595A] sm:text-3xl transition-transform duration-150">
              {formatDays(diasEneFeb)} de carpa por cuota
            </h3>
            <span className="inline-flex w-fit items-center rounded-full bg-[#2F595A]/10 px-3 py-1 text-xs font-bold text-[#2F595A]">
              Tramo para {units} {units === 1 ? 'unidad' : 'unidades'}
            </span>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-[#2A2622]/80 leading-relaxed">
            Es lo que pagás en cada una de las dos cuotas de verano, medido en tu propia tarifa de carpa.
          </p>
        </div>

        {/* Output 2: Bloque destacado - Temporada 2026/2027 (Lo que se vende) */}
        <div
          aria-live="polite"
          className="relative overflow-hidden rounded-3xl bg-[#2F595A] p-7 text-[#FCEFDE] shadow-xl sm:p-10"
        >
          {/* Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8C9A0]/25 pb-5">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#E8C9A0]">
                Oferta de Lanzamiento · Fundadores
              </span>
              <h3 className="mt-1 font-serif text-2xl font-black text-[#fffaf0] sm:text-3xl">
                Temporada 2026 / 2027
              </h3>
            </div>
            <span className="rounded-full bg-[#E8C9A0]/20 px-3.5 py-1.5 text-xs font-bold text-[#E8C9A0] border border-[#E8C9A0]/30">
              Septiembre a Diciembre 100% Bonificado
            </span>
          </div>

          {/* Hero Price & Equivalence Line */}
          <div className="mt-7 grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#E8C9A0]">
                Total toda la temporada
              </p>
              <p className="mt-1 font-serif text-5xl font-black tracking-[-0.04em] text-[#E8C9A0] sm:text-6xl md:text-7xl transition-all duration-200">
                {formatPesos(total2627)}
              </p>
            </div>

            {/* Same Visual Weight Equivalence Line */}
            <div className="rounded-2xl border border-[#E8C9A0]/30 bg-[#284f50] p-5 shadow-inner">
              <p className="font-serif text-xl font-black leading-snug text-[#fffaf0] sm:text-2xl">
                Toda la temporada te sale lo que cobrás por una carpa en{' '}
                <span className="text-[#E8C9A0] underline decoration-[#E8C9A0]/50 decoration-wavy underline-offset-4">
                  {formatDays(diasTotales2627)}
                </span>.
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="mt-8 space-y-3 rounded-2xl bg-[#234647] p-5 text-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8C9A0]/15 pb-3">
              <span className="font-medium text-[#fffaf0]">
                Septiembre a Diciembre (4 cuotas):
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#E8C9A0]/60 line-through">
                  {formatPesos(bonificado2627)}
                </span>
                <span className="rounded-md bg-[#E8C9A0]/20 px-2 py-0.5 text-xs font-black text-[#E8C9A0]">
                  ¡Bonificado!
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="font-medium text-[#fffaf0]">
                Enero y Febrero (verano):
              </span>
              <span className="font-serif font-black text-[#E8C9A0] text-base">
                2 cuotas de {formatPesos(cuotaEneFeb)}
              </span>
            </div>
          </div>

          {/* Clarification note */}
          <p className="mt-5 text-xs text-[#E8C9A0]/90 leading-relaxed flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-[#E8C9A0] shrink-0" />
            El sistema queda habilitado los doce meses del año. Solo se cobran enero y febrero.
          </p>
        </div>

        {/* Output 3: Bloque discreto - Temporada 2027/2028 (Precio de lista completo) */}
        <div
          aria-live="polite"
          className="rounded-3xl border border-[#2F595A]/15 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#2F595A]/10 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#2F595A]/70">
                Precio de lista futuro
              </p>
              <h4 className="font-serif text-xl font-black text-[#2F595A] sm:text-2xl">
                Temporada 2027 / 2028
              </h4>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-serif text-2xl font-black text-[#E24225] sm:text-3xl">
                {formatPesos(total2728)}
              </span>
              <p className="text-xs font-bold text-[#2F595A]">
                Equivale a {formatDays(diasTotales2728)} de carpa en total
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 text-xs sm:text-sm text-[#2A2622]/80 md:grid-cols-2">
            <div className="rounded-xl bg-[#F2EDE4] p-4">
              <p className="font-bold text-[#2F595A]">Preventa y renovación (Sep a Dic):</p>
              <p className="mt-1 font-serif text-base font-bold text-[#2F595A]">
                4 cuotas de {formatPesos(cuotaSepDic)}
              </p>
              <p className="mt-0.5 text-xs text-[#2F595A]/70">
                ({formatDays(diasSepDic)} de carpa por cuota)
              </p>
            </div>

            <div className="rounded-xl bg-[#F2EDE4] p-4">
              <p className="font-bold text-[#2F595A]">Operación de verano (Ene y Feb):</p>
              <p className="mt-1 font-serif text-base font-bold text-[#2F595A]">
                2 cuotas de {formatPesos(cuotaEneFeb)}
              </p>
              <p className="mt-0.5 text-xs text-[#2F595A]/70">
                ({formatDays(diasEneFeb)} de carpa por cuota)
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-[#2F595A]/80 leading-relaxed italic">
            A partir de la 27/28 se suma el módulo de preventa y renovación de temporada, que se cobra de septiembre a diciembre.
          </p>
        </div>

        {/* Footer Small Print */}
        <div className="border-t border-[#2F595A]/15 pt-6 text-center">
          <p className="text-xs text-[#2F595A]/80 leading-relaxed max-w-2xl mx-auto">
            El abono se mide en días de tu propia tarifa de carpa, así que se actualiza solo con tu lista de precios y nunca recibís una carta de aumento.
          </p>
        </div>
      </div>
    </section>
  );
}
