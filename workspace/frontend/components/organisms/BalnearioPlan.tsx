'use client';

import { PointerEvent, WheelEvent, useRef, useState } from 'react';
import { LocateFixed, ZoomIn, ZoomOut } from 'lucide-react';
import type { BalnearioPlan, PlanGeometry, PlanUnit, PlanUnitStatus } from '@/demo/plans/model';
import { Button } from '@/components/ui/button';

const statusStyle: Record<PlanUnitStatus, { label: string; fill: string; stroke: string }> = {
  available: { label: 'Disponible', fill: '#34d399', stroke: '#047857' },
  occupied: { label: 'Ocupada', fill: '#94a3b8', stroke: '#475569' },
  held: { label: 'En espera', fill: '#fbbf24', stroke: '#b45309' },
  maintenance: { label: 'Mantenimiento', fill: '#fda4af', stroke: '#be123c' },
};

interface BalnearioPlanProps {
  plan: BalnearioPlan;
  selectedUnitId?: string | null;
  onSelectUnit: (unit: PlanUnit) => void;
  selectable?: (unit: PlanUnit) => boolean;
  className?: string;
}

export function BalnearioPlan({ plan, selectedUnitId, onSelectUnit, selectable = () => true, className = '' }: BalnearioPlanProps) {
  const [scale, setScale] = useState(0.86);
  const [pan, setPan] = useState({ x: 38, y: 16 });
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  function changeZoom(amount: number) {
    setScale((current) => Math.min(2.5, Math.max(0.62, Number((current + amount).toFixed(2)))));
  }

  function onWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 0.12 : -0.12);
  }

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget) return;
    dragStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragStart.current) return;
    setPan({ x: dragStart.current.panX + event.clientX - dragStart.current.x, y: dragStart.current.panY + event.clientY - dragStart.current.y });
  }

  function stopDrag() {
    dragStart.current = null;
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-[#eaf4ed] ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Plano interactivo</p>
          <p className="text-xs text-slate-500">Arrastrá el plano, usá la rueda o los controles para acercarte.</p>
        </div>
        <div className="flex gap-1" aria-label="Controles del plano">
          <Button type="button" size="icon" variant="outline" onClick={() => changeZoom(-0.2)} aria-label="Alejar plano"><ZoomOut className="size-4" /></Button>
          <Button type="button" size="icon" variant="outline" onClick={() => { setScale(0.86); setPan({ x: 38, y: 16 }); }} aria-label="Restablecer vista"><LocateFixed className="size-4" /></Button>
          <Button type="button" size="icon" variant="outline" onClick={() => changeZoom(0.2)} aria-label="Acercar plano"><ZoomIn className="size-4" /></Button>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${plan.viewBox.width} ${plan.viewBox.height}`}
        className="block h-[420px] w-full touch-none select-none sm:h-[560px]"
        role="group"
        aria-label={`Plano interactivo de ${plan.venueName}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <rect width={plan.viewBox.width} height={plan.viewBox.height} fill="#f7f1dc" />
        <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
          {plan.landmarks.map((landmark) => <Landmark key={landmark.id} {...landmark} />)}
          {plan.units.map((unit) => {
            const status = statusStyle[unit.status];
            const isSelected = selectedUnitId === unit.id;
            const enabled = selectable(unit);
            return (
              <g
                key={unit.id}
                role="button"
                tabIndex={enabled ? 0 : -1}
                aria-label={`${unit.label}, ${status.label}, ${unit.capacity} personas`}
                aria-pressed={isSelected}
                onClick={() => enabled && onSelectUnit(unit)}
                onKeyDown={(event) => {
                  if (enabled && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onSelectUnit(unit);
                  }
                }}
                className={enabled ? 'cursor-pointer outline-none' : 'cursor-not-allowed'}
              >
                <UnitShape unit={unit} fill={isSelected ? '#f97316' : status.fill} stroke={isSelected ? '#9a3412' : status.stroke} selected={isSelected} enabled={enabled} />
              </g>
            );
          })}
        </g>
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-600" aria-label="Leyenda de estados">
        {Object.entries(statusStyle).map(([status, value]) => <span key={status} className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full" style={{ backgroundColor: value.fill }} />{value.label}</span>)}
        <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-orange-500" />Seleccionada</span>
      </div>
    </div>
  );
}

function UnitShape({ unit, fill, stroke, selected, enabled }: { unit: PlanUnit; fill: string; stroke: string; selected: boolean; enabled: boolean }) {
  const common = { fill: selected ? fill : unit.style?.fill ?? fill, stroke: selected ? stroke : unit.style?.stroke ?? stroke, strokeWidth: selected ? 3 : 1.5, opacity: enabled ? 1 : 0.7 };
  if (unit.geometry.kind === 'circle') return <><circle {...unit.geometry} {...common} /><text x={unit.geometry.cx} y={unit.geometry.cy + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#172554" pointerEvents="none">{unit.number}</text></>;
  if (unit.geometry.kind === 'rect') return <><rect {...unit.geometry} {...common} /><text x={unit.geometry.x + unit.geometry.width / 2} y={unit.geometry.y + unit.geometry.height / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#172554" pointerEvents="none">{unit.number}</text></>;
  return unit.geometry.kind === 'path' ? <path d={unit.geometry.d} {...common} /> : null;
}

function Landmark({ label, kind, geometry, labelPosition, style }: { label: string; kind: string; geometry: PlanGeometry; labelPosition?: { x: number; y: number }; style?: { fill?: string; stroke?: string } }) {
  const palette = kind === 'sea-edge'
    ? { fill: '#7dd3fc', stroke: '#0284c7' }
    : kind === 'patio'
      ? { fill: '#d9ead3', stroke: '#65a30d' }
      : kind === 'service'
        ? { fill: '#e9d5ff', stroke: '#7e22ce' }
        : { fill: '#fed7aa', stroke: '#c2410c' };
  const fill = style?.fill ?? palette.fill;
  const stroke = style?.stroke ?? palette.stroke;
  if (geometry.kind === 'path') return <><path d={geometry.d} fill={fill} stroke={stroke} strokeWidth="3" />{labelPosition && <text x={labelPosition.x} y={labelPosition.y} textAnchor="middle" fontSize="16" fontWeight="700" fill="#075985">{label}</text>}</>;
  if (geometry.kind === 'line') return <line {...geometry} fill="none" stroke={stroke} strokeWidth="3" />;
  if (geometry.kind === 'text') return <text x={geometry.x} y={geometry.y} fontSize="16" fontWeight="700" fill={stroke}>{label}</text>;
  if (geometry.kind === 'circle') return <><circle {...geometry} fill={fill} stroke={stroke} strokeWidth="3" /><text x={geometry.cx} y={geometry.cy + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{label}</text></>;
  return <><rect {...geometry} fill={fill} stroke={stroke} strokeWidth="3" /><text x={geometry.x + geometry.width / 2} y={geometry.y + geometry.height / 2 + 5} textAnchor="middle" fontSize={kind === 'patio' ? '12' : '15'} fontWeight="700" fill="#334155">{label}</text></>;
}
