'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Save, Trash2 } from 'lucide-react';
import {
  getDestinations, createDestination, updateDestination, deleteDestination,
  getSubnationalLevels, getTypologies, getPopulationRanges, getRegions, getMemberTypes,
} from '@/sdk/api/evaluations-api';

export default function DestinosTab() {
  const { data: destinations, isLoading, mutate } = useSWR('destinations-config', () => getDestinations());
  const { data: subnationalLevels } = useSWR('subnational-levels-dest', () => getSubnationalLevels());
  const { data: typologies } = useSWR('typologies-dest', () => getTypologies());
  const { data: popRanges } = useSWR('popranges-dest', () => getPopulationRanges());
  const { data: regions } = useSWR('regions-dest', () => getRegions());
  const { data: memberTypes } = useSWR('member-types-dest', () => getMemberTypes());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formSubnationalLevelId, setFormSubnationalLevelId] = useState('');
  const [formMemberTypeId, setFormMemberTypeId] = useState('');
  const [formTypologyId, setFormTypologyId] = useState('');
  const [formPopRangeId, setFormPopRangeId] = useState('');
  const [formRegionId, setFormRegionId] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [formAdhered, setFormAdhered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setFormName('');
    setFormCountry('');
    setFormSubnationalLevelId('');
    setFormMemberTypeId('');
    setFormTypologyId('');
    setFormPopRangeId('');
    setFormRegionId('');
    setFormLat('');
    setFormLng('');
    setFormAdhered(false);
    setDialogOpen(true);
  };

  const openEdit = (d: any) => {
    setEditItem(d);
    setFormName(d.name || '');
    setFormCountry(d.country || '');
    setFormSubnationalLevelId(d.subnational_level_id || '');
    setFormMemberTypeId(d.member_type_id || '');
    setFormTypologyId(d.typology_id || '');
    setFormPopRangeId(d.population_range_id || '');
    setFormRegionId(d.region_id || '');
    setFormLat(d.lat?.toString() || '');
    setFormLng(d.lng?.toString() || '');
    setFormAdhered(d.is_adhered || false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { alert('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const data = {
        name: formName.trim(),
        country: formCountry.trim() || undefined,
        subnational_level_id: formSubnationalLevelId || undefined,
        member_type_id: formMemberTypeId || undefined,
        typology_id: formTypologyId || undefined,
        population_range_id: formPopRangeId || undefined,
        region_id: formRegionId || undefined,
        lat: formLat ? Number(formLat) : undefined,
        lng: formLng ? Number(formLng) : undefined,
        is_adhered: formAdhered,
      };
      if (editItem) {
        await updateDestination(editItem.id, data);
      } else {
        await createDestination(data);
      }
      setDialogOpen(false);
      mutate();
    } catch (err) {
      alert('Error al guardar destino');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDestination(deleteId);
      mutate();
    } catch (err) {
      alert('Error al eliminar destino');
    }
    setDeleteId(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Destinos</CardTitle>
          <Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo Destino</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Nombre</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">País</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Adherido</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinations?.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>{d.country}</TableCell>
                <TableCell>
                  <Badge variant={d.is_adhered ? 'success' : 'secondary'}>
                    {d.is_adhered ? 'Sí' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Editar Destino' : 'Nuevo Destino'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nombre del destino" />
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Input value={formCountry} onChange={(e) => setFormCountry(e.target.value)} placeholder="País" />
            </div>
            <div className="space-y-2">
              <Label>Nivel subnacional</Label>
              <Select value={formSubnationalLevelId} onValueChange={setFormSubnationalLevelId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {subnationalLevels?.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Miembros</Label>
              <Select value={formMemberTypeId} onValueChange={setFormMemberTypeId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {memberTypes?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipología</Label>
              <Select value={formTypologyId} onValueChange={setFormTypologyId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {typologies?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rango de población</Label>
              <Select value={formPopRangeId} onValueChange={setFormPopRangeId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {popRanges?.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Región</Label>
              <Select value={formRegionId} onValueChange={setFormRegionId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {regions?.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitud</Label>
                <Input type="number" step="any" value={formLat} onChange={(e) => setFormLat(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Longitud</Label>
                <Input type="number" step="any" value={formLng} onChange={(e) => setFormLng(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="adherido" checked={formAdhered} onCheckedChange={(v) => setFormAdhered(v === true)} />
              <Label htmlFor="adherido">Adherido</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="mr-2 h-4 w-4" />{saving ? 'Guardando...' : (editItem ? 'Actualizar Destino' : 'Crear Destino')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="¿Eliminar destino?"
        description={`Esta acción eliminará "${destinations?.find((d) => d.id === deleteId)?.name}\" de forma permanente.`}
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
      />
    </Card>
  );
}
