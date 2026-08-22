import Link from 'next/link';
import { ArrowLeft, Layers, Sparkles } from 'lucide-react';
import { PlanEditor } from '@/components/organisms/PlanEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlanEditorPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/planificacion">
              <ArrowLeft className="size-4" />
              Plano Activo
            </Link>
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-700">Editor de Planos</span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/planos">
            <Layers className="size-4" />
            Ver Mis Planos
          </Link>
        </Button>
      </div>

      <section className="rounded-2xl bg-[#063b4c] px-6 py-7 text-white sm:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-cyan-200 uppercase">Diseñador Visual de Planos</p>
            <h1 className="mt-2 text-3xl font-semibold">Diseñá o modificá un plano</h1>
            <p className="mt-2 max-w-3xl text-sm text-cyan-50">
              Dibujá sectores, carpas y sombrillas en el lienzo. Al guardar con el identificador del balneario (ej: <code className="rounded bg-white/20 px-1 font-mono text-xs">cocodrilo-pinamar</code>), las unidades quedan disponibles para realizar reservas.
            </p>
          </div>
        </div>
      </section>

      <PlanEditor />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-amber-500" />
            ¿Cómo usar el plano editado?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-slate-600">
          <p>
            <strong>1. Guardado local:</strong> Asignale un identificador (slug) al balneario y hacé clic en <strong>Guardar borrador local</strong>.
          </p>
          <p>
            <strong>2. Activación en Operación:</strong> Al ir a <Link href="/app/planificacion" className="font-semibold text-[#063b4c] underline">Plano Activo</Link> o <Link href="/app/reservas" className="font-semibold text-[#063b4c] underline">Reservas</Link>, el sistema usará automáticamente tu distribución editada.
          </p>
          <p>
            <strong>3. Exportación:</strong> Podés exportar el plano en formato JSON para respaldarlo o usarlo en otro navegador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
