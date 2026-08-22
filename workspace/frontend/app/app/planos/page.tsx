'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Edit3, Eye, Layers, MapPin, Plus, Sparkles } from 'lucide-react';
import { balnearioPlans } from '@/demo/plans';
import { getDraftPlan, getDraftSlugs } from '@/lib/draft-plan';
import type { BalnearioPlan } from '@/demo/plans/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlanItem {
  slug: string;
  venueName: string;
  location: string;
  unitsCount: number;
  zonesCount: number;
  isDraft: boolean;
}

export default function PlansGalleryPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);

  useEffect(() => {
    const list: PlanItem[] = [];
    const draftSlugs = getDraftSlugs();

    // Add draft plans
    for (const slug of draftSlugs) {
      const draft = getDraftPlan(slug);
      if (draft) {
        list.push({
          slug,
          venueName: draft.venueName || slug,
          location: draft.location || 'Ubicación personalizada',
          unitsCount: draft.units.length,
          zonesCount: draft.zones.length,
          isDraft: true,
        });
      }
    }

    // Add built-in fixture plans if not already covered by drafts
    for (const fixture of balnearioPlans) {
      if (!list.some((p) => p.slug === fixture.id)) {
        list.push({
          slug: fixture.id,
          venueName: fixture.venueName,
          location: fixture.location,
          unitsCount: fixture.units.length,
          zonesCount: fixture.zones.length,
          isDraft: false,
        });
      }
    }

    setPlans(list);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <section className="rounded-2xl bg-[#063b4c] px-6 py-7 text-white sm:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-cyan-200 uppercase">Gestión de Diseños</p>
            <h1 className="mt-2 text-3xl font-semibold">Mis Planos y Diseños</h1>
            <p className="mt-2 max-w-2xl text-sm text-cyan-50">
              Administrá tus planos guardados, seleccioná el plano activo para la operación diaria o diseñá una nueva distribución desde el lienzo.
            </p>
          </div>
          <Button asChild size="lg" className="bg-[#f0512d] text-white hover:bg-[#dc4829]">
            <Link href="/app/planos/editor">
              <Plus className="size-5" />
              Crear Nuevo Plano
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((item) => (
          <Card key={item.slug} className="flex flex-col justify-between overflow-hidden transition hover:shadow-md">
            <div>
              <CardHeader className="bg-slate-50/70 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={item.isDraft ? 'default' : 'secondary'} className={item.isDraft ? 'bg-sky-600' : ''}>
                    {item.isDraft ? 'Borrador Personalizado' : 'Plantilla Base'}
                  </Badge>
                  <span className="font-mono text-xs text-slate-400">{item.slug}</span>
                </div>
                <CardTitle className="mt-3 text-xl font-bold text-slate-900">{item.venueName}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="size-3.5" />
                  {item.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm">
                <div className="flex justify-between border-b pb-2 text-xs text-slate-600">
                  <span>Unidades modeladas</span>
                  <span className="font-semibold text-slate-900">{item.unitsCount} unidades</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-xs text-slate-600">
                  <span>Sectores / Zonas</span>
                  <span className="font-semibold text-slate-900">{item.zonesCount} zonas</span>
                </div>
              </CardContent>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t p-4">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/app/planificacion?slug=${item.slug}`}>
                  <Eye className="size-4" />
                  Ver Activo
                </Link>
              </Button>
              <Button asChild size="sm" className="w-full bg-[#063b4c] hover:bg-[#0b5267]">
                <Link href="/app/planos/editor">
                  <Edit3 className="size-4" />
                  Editar
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
