import Link from 'next/link';
import { PlanEditor } from '@/components/organisms/PlanEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlanConfigurationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
       <section className="rounded-2xl bg-[#063b4c] px-6 py-7 text-white"><p className="text-xs font-bold tracking-[0.18em] text-cyan-200">CONFIGURACIÓN · BORRADOR LOCAL</p><h1 className="mt-3 text-3xl font-semibold">Editor visual de planos</h1><p className="mt-2 max-w-3xl text-sm text-cyan-50">Construí el plano desde una referencia impresa. Los elementos decorativos no entran al inventario; las unidades alquilables sí conservan zona, tarifa y estado.</p></section>
       <PlanEditor />
       <Card><CardHeader><CardTitle>Alcance del MVP</CardTitle></CardHeader><CardContent className="text-sm leading-relaxed text-slate-600">El borrador queda sólo en el almacenamiento de este navegador. Exportalo para respaldarlo o transferirlo. No hay publicación, colaboración, control de versiones ni persistencia de backend todavía.</CardContent></Card>
      <Button asChild variant="outline"><Link href="/app/planificacion">Volver al plano operativo</Link></Button>
    </div>
  );
}
