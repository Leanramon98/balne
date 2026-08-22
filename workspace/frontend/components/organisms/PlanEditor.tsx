'use client';

import { ChangeEvent, PointerEvent, WheelEvent, useEffect, useRef, useState } from 'react';
import { Circle, Download, Grip, Import, Minus, MousePointer2, Move, Plus, RectangleHorizontal, Save, Square, Type, Undo2, Umbrella, Tent, Building2, Footprints, ZoomIn, ZoomOut } from 'lucide-react';
import { balnearioPlans } from '@/demo/plans';
import type { BalnearioPlan, PlanGeometry, PlanLandmark, PlanStyle, PlanUnit, PlanUnitStatus } from '@/demo/plans/model';
import { BalnearioPlan as PlanPreview } from '@/components/organisms/BalnearioPlan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { draftKey, saveDraftPlan } from '@/lib/draft-plan';
import { getBalnearioBySlug, saveBalnearioPlan, type BookingsPlanUnit } from '@/sdk/api/bookings-api';

type Tool = 'select' | 'carpa-simple' | 'carpa-doble' | 'sombrilla' | 'pasillo' | 'servicio' | 'texto';
type Selected = { type: 'landmark' | 'unit'; id: string } | null;

const LEGACY_STORAGE_KEY = 'balne-plan-editor-draft-v1';

const blankPlan: BalnearioPlan = {
  id: 'draft-plan',
  venueName: 'Nuevo balneario',
  location: 'Ubicación pendiente',
  viewBox: { width: 1000, height: 700 },
  zones: [{ id: 'general', label: 'Zona general', color: '#0e7490', description: 'Unidades sin sector específico' }],
  tariffs: [{ id: 'standard', label: 'Tarifa estándar', dailyPrice: 78000 }],
  landmarks: [],
  units: [],
};

const presetTools: { id: Tool; label: string; icon: typeof Tent; badge?: string; desc: string }[] = [
  { id: 'select', label: 'Seleccionar / Mover', icon: MousePointer2, desc: 'Haz clic en un elemento para moverlo o editarlo.' },
  { id: 'carpa-simple', label: 'Carpa Simple (4 p.)', icon: Tent, badge: 'Carpa', desc: 'Haz clic en el lienzo para colocar una carpa estándar.' },
  { id: 'carpa-doble', label: 'Carpa Doble (8 p.)', icon: Tent, badge: 'Doble', desc: 'Haz clic en el lienzo para colocar una carpa grande.' },
  { id: 'sombrilla', label: 'Sombrilla (2 p.)', icon: Umbrella, badge: 'Sombrilla', desc: 'Haz clic en el lienzo para colocar una sombrilla circular.' },
  { id: 'pasillo', label: 'Camino / Pasillo', icon: Footprints, badge: 'Decoración', desc: 'Coloca un pasillo o camino peatonal.' },
  { id: 'servicio', label: 'Recepción / Bar', icon: Building2, badge: 'Servicio', desc: 'Coloca un área de servicios o administración.' },
  { id: 'texto', label: 'Cartel de texto', icon: Type, badge: 'Texto', desc: 'Coloca un texto explicativo.' },
];

const statusLabels: Record<PlanUnitStatus, string> = {
  available: 'Disponible',
  occupied: 'Ocupada',
  held: 'En espera',
  maintenance: 'Mantenimiento',
};

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
function uid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

export function PlanEditor() {
  const [plan, setPlan] = useState<BalnearioPlan>(clone(blankPlan));
  const [slug, setSlug] = useState('mi-balneario');
  const [tool, setTool] = useState<Tool>('carpa-simple');
  const [selected, setSelected] = useState<Selected>(null);
  const [preview, setPreview] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [scale, setScale] = useState(0.82);
  const [pan, setPan] = useState({ x: 80, y: 45 });
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const gesture = useRef<{ start: { x: number; y: number }; origin?: { x: number; y: number }; panning?: true } | null>(null);

  useEffect(() => {
    try {
      const slugKey = slug ? draftKey(slug) : null;
      const stored = slugKey ? window.localStorage.getItem(slugKey) : null;
      if (stored) {
        setPlan(JSON.parse(stored));
      } else {
        const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) setPlan(JSON.parse(legacy));
      }
    } catch { /* Ignore malformed drafts */ }
  }, [slug]);

  function point(event: PointerEvent<SVGSVGElement>) {
    const bounds = svgRef.current!.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * plan.viewBox.width / bounds.width - pan.x) / scale,
      y: ((event.clientY - bounds.top) * plan.viewBox.height / bounds.height - pan.y) / scale,
    };
  }

  function update(updater: (current: BalnearioPlan) => BalnearioPlan) {
    setPlan((current) => updater(current));
  }

  function placePresetAt(pos: { x: number; y: number }, presetTool: Tool) {
    if (presetTool === 'select') return;

    const nextNumber = plan.units.length + 1;

    if (presetTool === 'carpa-simple') {
      const unit: PlanUnit = {
        id: uid('carpa'),
        label: `Carpa ${nextNumber}`,
        number: nextNumber,
        geometry: { kind: 'rect', x: Math.round(pos.x - 20), y: Math.round(pos.y - 18), width: 40, height: 36, rx: 4 },
        zoneId: plan.zones[0]?.id ?? 'general',
        capacity: 4,
        tariffId: plan.tariffs[0]?.id ?? 'standard',
        status: 'available',
        style: { fill: '#bae6fd', stroke: '#0369a1' },
      };
      update((current) => ({ ...current, units: [...current.units, unit] }));
      setSelected({ type: 'unit', id: unit.id });
      return;
    }

    if (presetTool === 'carpa-doble') {
      const unit: PlanUnit = {
        id: uid('carpa-doble'),
        label: `Carpa ${nextNumber}`,
        number: nextNumber,
        geometry: { kind: 'rect', x: Math.round(pos.x - 40), y: Math.round(pos.y - 18), width: 80, height: 36, rx: 4 },
        zoneId: plan.zones[0]?.id ?? 'general',
        capacity: 8,
        tariffId: plan.tariffs[0]?.id ?? 'standard',
        status: 'available',
        style: { fill: '#38bdf8', stroke: '#0284c7' },
      };
      update((current) => ({ ...current, units: [...current.units, unit] }));
      setSelected({ type: 'unit', id: unit.id });
      return;
    }

    if (presetTool === 'sombrilla') {
      const unit: PlanUnit = {
        id: uid('sombrilla'),
        label: `Sombrilla ${nextNumber}`,
        number: nextNumber,
        geometry: { kind: 'circle', cx: Math.round(pos.x), cy: Math.round(pos.y), r: 18 },
        zoneId: plan.zones[0]?.id ?? 'general',
        capacity: 2,
        tariffId: plan.tariffs[0]?.id ?? 'standard',
        status: 'available',
        style: { fill: '#fef08a', stroke: '#ca8a04' },
      };
      update((current) => ({ ...current, units: [...current.units, unit] }));
      setSelected({ type: 'unit', id: unit.id });
      return;
    }

    if (presetTool === 'pasillo') {
      const landmark: PlanLandmark = {
        id: uid('pasillo'),
        label: 'Pasillo',
        kind: 'patio',
        geometry: { kind: 'rect', x: Math.round(pos.x - 60), y: Math.round(pos.y - 12), width: 120, height: 24, rx: 3 },
        style: { fill: '#e2e8f0', stroke: '#94a3b8' },
      };
      update((current) => ({ ...current, landmarks: [...current.landmarks, landmark] }));
      setSelected({ type: 'landmark', id: landmark.id });
      return;
    }

    if (presetTool === 'servicio') {
      const landmark: PlanLandmark = {
        id: uid('servicio'),
        label: 'Bar / Recepción',
        kind: 'service',
        geometry: { kind: 'rect', x: Math.round(pos.x - 45), y: Math.round(pos.y - 30), width: 90, height: 60, rx: 6 },
        style: { fill: '#e9d5ff', stroke: '#7e22ce' },
      };
      update((current) => ({ ...current, landmarks: [...current.landmarks, landmark] }));
      setSelected({ type: 'landmark', id: landmark.id });
      return;
    }

    if (presetTool === 'texto') {
      const landmark: PlanLandmark = {
        id: uid('texto'),
        label: 'Texto descriptivo',
        kind: 'landmark',
        geometry: { kind: 'text', x: Math.round(pos.x), y: Math.round(pos.y) },
        style: { fill: '#ffffff', stroke: '#0369a1' },
      };
      update((current) => ({ ...current, landmarks: [...current.landmarks, landmark] }));
      setSelected({ type: 'landmark', id: landmark.id });
      return;
    }
  }

  function onCanvasDown(event: PointerEvent<SVGSVGElement>) {
    const isBackground = event.target === event.currentTarget || (event.target instanceof SVGRectElement && event.target.dataset.canvas === 'true');
    const start = point(event);

    if (tool !== 'select') {
      if (isBackground) {
        placePresetAt(start, tool);
      }
      return;
    }

    if (isBackground) {
      gesture.current = { start, origin: { ...pan }, panning: true };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function onCanvasMove(event: PointerEvent<SVGSVGElement>) {
    const action = gesture.current;
    if (!action?.panning || !action.origin) return;
    const now = point(event);
    setPan({
      x: action.origin.x + (now.x - action.start.x) * scale,
      y: action.origin.y + (now.y - action.start.y) * scale,
    });
  }

  function moveSelected(event: PointerEvent<SVGGElement>, item: Exclude<Selected, null>) {
    if (tool !== 'select') {
      setSelected(item);
      return;
    }
    event.stopPropagation();
    const start = point(event as unknown as PointerEvent<SVGSVGElement>);
    const initial = clone(item.type === 'unit' ? plan.units.find((u) => u.id === item.id)! : plan.landmarks.find((l) => l.id === item.id)!);
    setSelected(item);
    gesture.current = { start };
    event.currentTarget.setPointerCapture(event.pointerId);

    const move = (moveEvent: globalThis.PointerEvent) => {
      const bounds = svgRef.current!.getBoundingClientRect();
      const now = {
        x: ((moveEvent.clientX - bounds.left) * plan.viewBox.width / bounds.width - pan.x) / scale,
        y: ((moveEvent.clientY - bounds.top) * plan.viewBox.height / bounds.height - pan.y) / scale,
      };
      const dx = Math.round(now.x - start.x);
      const dy = Math.round(now.y - start.y);
      update((current) => shiftItem(current, item, initial.geometry, dx, dy));
    };

    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  }

  async function save() {
    const cleanSlug = slug.trim();
    if (!cleanSlug) return;

    const planToSave: BalnearioPlan = {
      ...plan,
      id: cleanSlug,
      venueName: plan.venueName && plan.venueName !== 'Nuevo balneario'
        ? plan.venueName
        : cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    };

    setPlan(planToSave);
    saveDraftPlan(cleanSlug, planToSave);

    try {
      const bData = await getBalnearioBySlug(cleanSlug);
      if (bData && bData.id) {
        const apiUnits: Partial<BookingsPlanUnit>[] = planToSave.units.map((u) => ({
          unit_number: String(u.number),
          zone: u.zoneId || 'general',
          capacity: u.capacity,
          position_x: u.geometry.kind === 'circle' ? u.geometry.cx : u.geometry.kind === 'rect' ? u.geometry.x : 0,
          position_y: u.geometry.kind === 'circle' ? u.geometry.cy : u.geometry.kind === 'rect' ? u.geometry.y : 0,
          width: u.geometry.kind === 'rect' ? u.geometry.width : (u.geometry.kind === 'circle' ? u.geometry.r * 2 : 40),
          height: u.geometry.kind === 'rect' ? u.geometry.height : (u.geometry.kind === 'circle' ? u.geometry.r * 2 : 40),
          shape: u.geometry.kind === 'circle' ? 'circle' : 'rectangle',
          is_rentable: true,
          status: u.status,
        }));
        await saveBalnearioPlan(bData.id, apiUnits);
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('balne-plan-updated', { detail: { slug: cleanSlug } }));
    }

    setSavedAt(new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(new Date()));
  }

  function exportJson() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' }));
    a.download = `${plan.id || 'plano'}-borrador.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const draft = JSON.parse(String(reader.result));
        if (!draft?.viewBox || !Array.isArray(draft.units) || !Array.isArray(draft.landmarks)) throw new Error();
        setPlan(draft);
        setSelected(null);
      } catch {
        window.alert('El archivo no contiene un borrador de plano compatible.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function deleteSelected() {
    if (!selected) return;
    update((current) =>
      selected.type === 'unit'
        ? { ...current, units: current.units.filter((item) => item.id !== selected.id) }
        : { ...current, landmarks: current.landmarks.filter((item) => item.id !== selected.id) },
    );
    setSelected(null);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault();
        deleteSelected();
      }
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const item = selected?.type === 'unit' ? plan.units.find((unit) => unit.id === selected.id) : selected ? plan.landmarks.find((landmark) => landmark.id === selected.id) : undefined;
  const templates: Array<{ id: string; venueName: string; plan?: BalnearioPlan }> = [
    { id: 'blank', venueName: 'Plano en blanco' },
    ...balnearioPlans.map((source) => ({ id: source.id, venueName: source.venueName, plan: source })),
  ];

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
          <div>
            <strong>Previsualización del plano activo</strong>
            <p className="text-sm text-slate-600">Así es como verán tus clientes y empleados este balneario.</p>
          </div>
          <Button variant="outline" onClick={() => setPreview(false)}><Undo2 className="size-4" />Volver al editor</Button>
        </div>
        <PlanPreview plan={plan} onSelectUnit={() => undefined} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" aria-label="Plantillas de plano">
        <span className="text-sm font-semibold text-slate-700">Cargar plantilla:</span>
        {templates.map((template) => (
          <Button
            key={template.id}
            type="button"
            size="sm"
            variant={template.id === slug ? 'default' : 'outline'}
            onClick={() => {
              const loaded = clone(template.plan ?? blankPlan);
              setPlan(loaded);
              if (template.id !== 'blank') setSlug(template.id);
              setSelected(null);
            }}
          >
            {template.venueName}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="plan-slug" className="whitespace-nowrap text-xs font-bold text-slate-700">Slug (identificador URL):</Label>
            <Input id="plan-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="mi-balneario" className="h-8 w-40 font-mono text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="plan-name" className="whitespace-nowrap text-xs font-bold text-slate-700">Nombre Balneario:</Label>
            <Input id="plan-name" value={plan.venueName} onChange={(e) => setPlan((current) => ({ ...current, venueName: e.target.value }))} placeholder="Mi Balneario" className="h-8 w-48 text-sm" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={!slug.trim()} className="bg-[#063b4c] text-white hover:bg-[#0b5267]">
            <Save className="size-4" />Guardar borrador local
          </Button>
          <Button variant="outline" size="sm" onClick={exportJson}><Download className="size-4" />Exportar JSON</Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Import className="size-4" />Importar</Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJson} />
          <Button variant="outline" size="sm" onClick={() => setPreview(true)}>Vista previa</Button>
        </div>
      </div>

      {savedAt && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
          ✓ Guardado correctamente a las {savedAt}. Ya podés usarlo en Plano Activo y Reservas.
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        {/* SIDEBAR TOOLS */}
        <aside className="rounded-xl border bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Herramientas de dibujo</p>
          <p className="mb-3 text-xs text-slate-600">Seleccioná un elemento y hacé <strong>clic en el lienzo</strong> para ubicarlo:</p>
          <div className="space-y-1.5">
            {presetTools.map((entry) => {
              const Icon = entry.icon;
              const active = tool === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setTool(entry.id)}
                  className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all ${
                    active
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className={`size-4 ${active ? 'text-cyan-700' : 'text-slate-500'}`} />
                    {entry.label}
                  </span>
                  {entry.badge && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-cyan-200 text-cyan-900' : 'bg-slate-100 text-slate-600'}`}>
                      {entry.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600">
            <p className="font-semibold text-slate-800">💡 Tip de uso:</p>
            <p className="mt-1">
              Con <strong>Carpa Simple</strong> o <strong>Sombrilla</strong> activadas, podés hacer clic varias veces en el mapa para ir ubicando una fila completa de carpas rápidamente.
            </p>
          </div>
        </aside>

        {/* CANVAS */}
        <div className="overflow-hidden rounded-xl border bg-slate-100 shadow-sm">
          <div className="flex items-center justify-between border-b bg-white px-3 py-2 text-xs text-slate-600">
            <span className="font-medium text-slate-800">
              {tool === 'select'
                ? 'Modo Selección: Arrastrá los elementos para ubicarlos o hacé clic para abrirlos en el Inspector.'
                : `Modo Dibujo: Hacé clic sobre el lienzo para colocar ${presetTools.find((t) => t.id === tool)?.label}.`}
            </span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Alejar" onClick={() => setScale((value) => Math.max(0.4, value - 0.15))}>
                <ZoomOut className="size-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Restablecer vista" onClick={() => { setScale(0.82); setPan({ x: 80, y: 45 }); }}>
                <Move className="size-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Acercar" onClick={() => setScale((value) => Math.min(2.2, value + 0.15))}>
                <ZoomIn className="size-3.5" />
              </Button>
            </div>
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${plan.viewBox.width} ${plan.viewBox.height}`}
            className={`h-[540px] w-full touch-none select-none ${tool !== 'select' ? 'cursor-crosshair' : 'cursor-default'}`}
            role="application"
            aria-label="Editor visual de plano"
            onPointerDown={onCanvasDown}
            onPointerMove={onCanvasMove}
            onWheel={(event: WheelEvent<SVGSVGElement>) => {
              event.preventDefault();
              setScale((value) => Math.max(0.4, Math.min(2.2, value + (event.deltaY < 0 ? 0.1 : -0.1))));
            }}
          >
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#cbd5e1" strokeWidth="1" />
              </pattern>
            </defs>
            <rect data-canvas="true" width={plan.viewBox.width} height={plan.viewBox.height} fill="#f8fafc" />
            <rect data-canvas="true" width={plan.viewBox.width} height={plan.viewBox.height} fill="url(#grid)" />

            <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
              {plan.landmarks.map((landmark) => (
                <EditableLandmark
                  key={landmark.id}
                  landmark={landmark}
                  selected={selected?.type === 'landmark' && selected.id === landmark.id}
                  onPointerDown={(event) => moveSelected(event, { type: 'landmark', id: landmark.id })}
                />
              ))}
              {plan.units.map((unit) => (
                <EditableUnit
                  key={unit.id}
                  unit={unit}
                  selected={selected?.type === 'unit' && selected.id === unit.id}
                  onPointerDown={(event) => moveSelected(event, { type: 'unit', id: unit.id })}
                />
              ))}
            </g>
          </svg>
        </div>

        {/* INSPECTOR */}
        <Inspector plan={plan} selected={selected} item={item} onChange={update} onDelete={deleteSelected} />
      </section>
    </div>
  );
}

function shiftGeometry(geometry: PlanGeometry, dx: number, dy: number): PlanGeometry {
  if (geometry.kind === 'rect') return { ...geometry, x: geometry.x + dx, y: geometry.y + dy };
  if (geometry.kind === 'circle') return { ...geometry, cx: geometry.cx + dx, cy: geometry.cy + dy };
  if (geometry.kind === 'line') return { ...geometry, x1: geometry.x1 + dx, y1: geometry.y1 + dy, x2: geometry.x2 + dx, y2: geometry.y2 + dy };
  if (geometry.kind === 'text') return { ...geometry, x: geometry.x + dx, y: geometry.y + dy };
  return geometry;
}

function shiftItem(plan: BalnearioPlan, selected: Exclude<Selected, null>, original: PlanGeometry, dx: number, dy: number): BalnearioPlan {
  if (selected.type === 'unit') {
    return {
      ...plan,
      units: plan.units.map((unit) => (unit.id === selected.id ? { ...unit, geometry: shiftGeometry(original, dx, dy) } : unit)),
    };
  }
  return {
    ...plan,
    landmarks: plan.landmarks.map((landmark) => (landmark.id === selected.id ? { ...landmark, geometry: shiftGeometry(original, dx, dy) } : landmark)),
  };
}

function EditableLandmark({ landmark, selected, onPointerDown }: { landmark: PlanLandmark; selected: boolean; onPointerDown: (event: PointerEvent<SVGGElement>) => void }) {
  const style = { fill: landmark.style?.fill ?? '#fef3c7', stroke: landmark.style?.stroke ?? '#a16207' };
  const g = landmark.geometry;
  return (
    <g role="button" tabIndex={0} aria-label={`Elemento decorativo ${landmark.label}`} onPointerDown={onPointerDown} className="cursor-pointer">
      {g.kind === 'rect' ? (
        <rect {...g} {...style} strokeWidth={selected ? 4 : 2} />
      ) : g.kind === 'circle' ? (
        <circle {...g} {...style} strokeWidth={selected ? 4 : 2} />
      ) : g.kind === 'line' ? (
        <line {...g} stroke={style.stroke} strokeWidth={selected ? 5 : 3} />
      ) : g.kind === 'text' ? (
        <text x={g.x} y={g.y} fill={style.stroke} fontSize="18" fontWeight="700">{landmark.label}</text>
      ) : (
        <path d={g.d} {...style} strokeWidth={selected ? 4 : 2} />
      )}
      {g.kind !== 'text' && g.kind !== 'line' && (
        <text
          x={g.kind === 'circle' ? g.cx : g.kind === 'rect' ? g.x + g.width / 2 : 0}
          y={g.kind === 'circle' ? g.cy + 5 : g.kind === 'rect' ? g.y + g.height / 2 + 5 : 0}
          textAnchor="middle"
          fontSize="13"
          fontWeight="600"
          fill="#334155"
          pointerEvents="none"
        >
          {landmark.label}
        </text>
      )}
    </g>
  );
}

function EditableUnit({ unit, selected, onPointerDown }: { unit: PlanUnit; selected: boolean; onPointerDown: (event: PointerEvent<SVGGElement>) => void }) {
  const g = unit.geometry;
  const style = { fill: unit.style?.fill ?? '#bae6fd', stroke: unit.style?.stroke ?? '#0369a1' };
  return (
    <g role="button" tabIndex={0} aria-label={`Unidad ${unit.label}`} onPointerDown={onPointerDown} className="cursor-pointer">
      {g.kind === 'rect' ? (
        <rect {...g} {...style} strokeWidth={selected ? 4 : 2} />
      ) : g.kind === 'circle' ? (
        <circle {...g} {...style} strokeWidth={selected ? 4 : 2} />
      ) : null}
      {(g.kind === 'rect' || g.kind === 'circle') && (
        <text
          x={g.kind === 'rect' ? g.x + g.width / 2 : g.cx}
          y={g.kind === 'rect' ? g.y + g.height / 2 + 4 : g.cy + 4}
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="#0f172a"
          pointerEvents="none"
        >
          {unit.number}
        </text>
      )}
    </g>
  );
}

function Inspector({ plan, selected, item, onChange, onDelete }: { plan: BalnearioPlan; selected: Selected; item: PlanLandmark | PlanUnit | undefined; onChange: (updater: (current: BalnearioPlan) => BalnearioPlan) => void; onDelete: () => void }) {
  if (!selected || !item) {
    return (
      <aside className="rounded-xl border bg-white p-4 text-sm text-slate-500 shadow-sm">
        <p className="font-semibold text-slate-900">Inspector de elemento</p>
        <p className="mt-2 text-xs">Hacé clic en cualquier carpa o elemento colado para editar sus propiedades o eliminarlo.</p>
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
          <p><strong>Atajos:</strong></p>
          <p>• <code className="bg-slate-200 px-1 rounded">Supr</code> elimina el elemento</p>
          <p>• <code className="bg-slate-200 px-1 rounded">Esc</code> deselecciona</p>
        </div>
      </aside>
    );
  }

  const unit = selected.type === 'unit' ? item as PlanUnit : null;
  const geometry = item.geometry;
  const numeric = (key: string, value: string) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    change({ geometry: { ...geometry, [key]: number } as PlanGeometry });
  };

  const change = (patch: Partial<PlanLandmark | PlanUnit>) =>
    onChange((current) =>
      selected.type === 'unit'
        ? { ...current, units: current.units.map((value) => (value.id === selected.id ? { ...value, ...patch } : value)) }
        : { ...current, landmarks: current.landmarks.map((value) => (value.id === selected.id ? { ...value, ...patch } : value)) },
    );

  return (
    <aside className="h-fit rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">{unit ? 'UNIDAD ALQUILABLE' : 'ELEMENTO DECORATIVO'}</p>
          <p className="font-semibold text-slate-900">{item.label}</p>
        </div>
        <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:bg-red-50" aria-label="Eliminar elemento seleccionado" onClick={onDelete}>
          <Grip className="size-4 rotate-45" />
        </Button>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <Field label={unit ? 'Etiqueta' : geometry.kind === 'text' ? 'Texto' : 'Etiqueta'} value={item.label} onChange={(value) => change({ label: value })} />
        <div className="grid grid-cols-2 gap-2">
          <NumberField label={geometry.kind === 'circle' ? 'Centro X' : geometry.kind === 'line' ? 'X inicial' : 'X'} value={geometry.kind === 'circle' ? geometry.cx : geometry.kind === 'line' ? geometry.x1 : geometry.kind === 'path' ? 0 : geometry.x} onChange={(value) => numeric(geometry.kind === 'circle' ? 'cx' : geometry.kind === 'line' ? 'x1' : 'x', value)} />
          <NumberField label={geometry.kind === 'circle' ? 'Centro Y' : geometry.kind === 'line' ? 'Y inicial' : 'Y'} value={geometry.kind === 'circle' ? geometry.cy : geometry.kind === 'line' ? geometry.y1 : geometry.kind === 'path' ? 0 : geometry.y} onChange={(value) => numeric(geometry.kind === 'circle' ? 'cy' : geometry.kind === 'line' ? 'y1' : 'y', value)} />
          {geometry.kind === 'rect' && (
            <>
              <NumberField label="Ancho" value={geometry.width} onChange={(value) => numeric('width', value)} />
              <NumberField label="Alto" value={geometry.height} onChange={(value) => numeric('height', value)} />
            </>
          )}
          {geometry.kind === 'circle' && <NumberField label="Radio" value={geometry.r} onChange={(value) => numeric('r', value)} />}
        </div>
        {geometry.kind !== 'path' && (
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="Relleno" value={item.style?.fill ?? (unit ? '#bae6fd' : '#fef3c7')} onChange={(value) => change({ style: { ...item.style, fill: value } })} />
            <ColorField label="Borde" value={item.style?.stroke ?? (unit ? '#0369a1' : '#a16207')} onChange={(value) => change({ style: { ...item.style, stroke: value } })} />
          </div>
        )}
        {unit && (
          <>
            <NumberField label="Número visible" value={unit.number} onChange={(value) => change({ number: Number(value) })} />
            <NumberField label="Capacidad (personas)" value={unit.capacity} onChange={(value) => change({ capacity: Number(value) })} />
            <SelectField label="Zona" value={unit.zoneId} options={plan.zones.map((zone) => [zone.id, zone.label])} onChange={(value) => change({ zoneId: value })} />
            <SelectField label="Tarifa" value={unit.tariffId} options={plan.tariffs.map((tariff) => [tariff.id, tariff.label])} onChange={(value) => change({ tariffId: value })} />
            <SelectField label="Disponibilidad" value={unit.status} options={Object.entries(statusLabels)} onChange={(value) => change({ status: value as PlanUnitStatus })} />
          </>
        )}
      </div>
    </aside>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-8 text-sm" />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <Input type="number" value={value} onChange={(event) => onChange(event.target.value)} className="h-8 text-sm" />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <Input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-8 p-1 cursor-pointer" />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([id, text]) => (
            <SelectItem key={id} value={id}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
