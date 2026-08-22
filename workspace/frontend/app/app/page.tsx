import { localDemoBalneario } from '@/demo/balne-fixture';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Umbrella, Waves } from 'lucide-react';

const statusLabels = {
  available: 'Disponible',
  occupied: 'Ocupada',
  held: 'En espera',
};

const statusClasses = {
  available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  occupied: 'bg-sky-100 text-sky-800 border-sky-200',
  held: 'bg-amber-100 text-amber-800 border-amber-200',
};

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: localDemoBalneario.currency,
  maximumFractionDigits: 0,
});

export default function OperationsOverviewPage() {
  const units = localDemoBalneario.units;
  const availableCount = units.filter((unit) => unit.status === 'available').length;
  const occupiedCount = units.filter((unit) => unit.status === 'occupied').length;
  const heldCount = units.filter((unit) => unit.status === 'held').length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <section className="overflow-hidden rounded-2xl bg-[#063b4c] px-6 py-7 text-white shadow-sm sm:px-8">
        <p className="text-xs font-bold tracking-[0.18em] text-cyan-200">OPERACIÓN CENTRAL</p>
        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{localDemoBalneario.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-cyan-50"><MapPin className="h-4 w-4" />{localDemoBalneario.location}</p>
          </div>
          <p className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium">{localDemoBalneario.dateLabel}</p>
        </div>
      </section>

      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>DEMO LOCAL.</strong> Disponibilidad, unidades y tarifas de muestra. Esta vista no guarda reservas, cobros ni accesos.
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Disponibles" value={availableCount} detail={`de ${units.length} unidades`} tone="text-emerald-700" icon={<Umbrella className="h-5 w-5" />} />
        <Metric label="Ocupadas" value={occupiedCount} detail="en uso ahora" tone="text-sky-700" icon={<Users className="h-5 w-5" />} />
        <Metric label="En espera" value={heldCount} detail="para confirmar" tone="text-amber-700" icon={<Waves className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Disponibilidad actual</CardTitle>
            <CardDescription>Estado operativo por unidad del balneario de muestra.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {units.map((unit) => (
              <div key={unit.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{unit.label}</p>
                  <p className="text-sm text-slate-500">{unit.sector} · {unit.capacity} personas</p>
                </div>
                <Badge variant="outline" className={statusClasses[unit.status]}>{statusLabels[unit.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarifas de muestra</CardTitle>
            <CardDescription>Valores diarios orientativos para el próximo flujo de venta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {localDemoBalneario.tariffs.map((tariff) => (
              <div key={tariff.name} className="rounded-xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{tariff.name}</p>
                <p className="mt-1 text-2xl font-semibold text-[#063b4c]">{currency.format(tariff.price)}</p>
                <p className="mt-1 text-sm text-slate-500">{tariff.detail} · por día</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({ label, value, detail, tone, icon }: { label: string; value: number; detail: string; tone: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-xl bg-slate-100 p-3 ${tone}`}>{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`text-3xl font-semibold ${tone}`}>{value}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
