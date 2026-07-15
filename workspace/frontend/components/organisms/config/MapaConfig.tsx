'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { getDestinations, getMemberTypes } from '@/sdk/api/evaluations-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Destination } from '@/types';
import L from 'leaflet';

// ── Colour palette per member type (deterministic) ─────────────────────
const PALETTE = [
  '#3b82f6', '#22c55e', '#ef4444', '#eab308', '#8b5cf6',
  '#f97316', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1',
];
function colourFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// ── Custom SVG icon builder ────────────────────────────────────────────
function createSvgIcon(color: string) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`
  );
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${svg}`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
}

// ── Auto-fit bounds when markers change ───────────────────────────────
function MapBoundsUpdater({ destinations }: { destinations: Destination[] }) {
  const map = useMap();
  useEffect(() => {
    if (destinations.length === 0) return;
    if (destinations.length === 1) {
      const d = destinations[0];
      map.setView([d.lat!, d.lng!], 12, { animate: true });
      return;
    }
    const group = new L.FeatureGroup(
      destinations.map((d) => L.marker([d.lat!, d.lng!]))
    );
    map.fitBounds(group.getBounds().pad(0.15), { animate: true });
  }, [destinations, map]);
  return null;
}

// ── Cluster custom styling ───────────────────────────────────────────
const clusterIconCreate = (cluster: any) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 30 : count < 100 ? 40 : 50;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:rgba(59,130,246,0.85);
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:13px;
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);
    ">${count}</div>`,
    className: 'marker-cluster-custom',
    iconSize: [size, size],
  });
};

export default function MapaTab() {
  const { data: destinations, isLoading } = useSWR('mapa-destinos', () => getDestinations());
  const { data: memberTypes } = useSWR('member-types-mapa', () => getMemberTypes());
  const [filterMemberType, setFilterMemberType] = useState('all');

  const filtered: Destination[] = useMemo(() => {
    return (destinations || []).filter((d: any) => {
      if (filterMemberType !== 'all' && d.member_type_id !== filterMemberType) return false;
      return d.lat != null && d.lng != null;
    });
  }, [destinations, filterMemberType]);

  // Legend: colour → member type name
  const legend = useMemo(() => {
    const map = new Map<string, string>();
    (memberTypes || []).forEach((t: any) => {
      map.set(colourFor(t.id), t.name);
    });
    return Array.from(map.entries());
  }, [memberTypes]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mapa de Destinos</CardTitle>
          <Badge variant="secondary">{filtered.length} destinos</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 flex-wrap items-end">
          <div className="space-y-1">
            <Label className="text-xs">Miembros</Label>
            <Select value={filterMemberType} onValueChange={setFilterMemberType}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {memberTypes?.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs">
            {legend.map(([color, name]) => (
              <span key={color} className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="rounded-lg border overflow-hidden" style={{ height: '520px' }}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
              <div className="text-4xl mb-2">🌍</div>
              <p className="text-sm font-medium">No hay destinos con coordenadas</p>
              <p className="text-xs">Agregá latitud y longitud en la configuración de destinos</p>
            </div>
          ) : (
            <MapContainer
              center={[-34.6037, -58.3816]}
              zoom={4}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapBoundsUpdater destinations={filtered} />
              <MarkerClusterGroup iconCreateFunction={clusterIconCreate}>
                {filtered.map((d: any) => {
                  const color = d.member_type_id ? colourFor(d.member_type_id) : PALETTE[0];
                  return (
                    <Marker
                      key={d.id}
                      position={[d.lat, d.lng]}
                      icon={createSvgIcon(color)}
                    >
                      <Popup>
                        <div className="space-y-1 min-w-[220px]">
                          <p className="font-semibold text-sm">{d.name}</p>
                          {d.country && <p className="text-xs text-gray-500">{d.country}</p>}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {d.is_adhered && (
                              <Badge variant="success" className="text-[10px]">Adherido</Badge>
                            )}
                            {d.member_type?.name && (
                              <Badge variant="outline" className="text-[10px]">{d.member_type.name}</Badge>
                            )}
                          </div>
                          {d.population_range?.name && (
                            <p className="text-[10px] text-gray-400">{d.population_range.name}</p>
                          )}
                          <p className="text-[10px] text-gray-400 font-mono mt-1">
                            {d.lat.toFixed(5)}, {d.lng.toFixed(5)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            </MapContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
