'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  getRegions, createRegion, updateRegion, deleteRegion,
  getDestinations,
} from '@/sdk/api/evaluations-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Save } from 'lucide-react';

export default function RegionesTab() {
  const { data: items, isLoading, mutate } = useSWR('regiones-config', () => getRegions());
  const { data: destinations } = useSWR('destinations-regions', () => getDestinations());
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDestIds, setSelectedDestIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditItem(null); setName(''); setDescription(''); setSelectedDestIds([]); setOpen(true);
  };
  const openEdit = (item: any) => {
    setEditItem(item); setName(item.name); setDescription(item.description || '');
    setSelectedDestIds(item.destination_ids || []);
    setOpen(true);
  };

  const toggleDest = (id: string) => {
    setSelectedDestIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = { name: name.trim(), description: description.trim() || undefined, destination_ids: selectedDestIds };
      if (editItem) await updateRegion(editItem.id, data);
      else await createRegion(data);
      setOpen(false);
      mutate();
    } catch { alert('Error al guardar'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteRegion(id); mutate(); } catch { alert('Error al eliminar'); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Regiones</CardTitle>
          <Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nueva RegiÃ³n</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Nombre</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">DescripciÃ³n</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Destinos</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-sm text-gray-500">{item.description || '-'}</TableCell>
                <TableCell className="text-sm">
                  {item.destination_ids?.length ? `${item.destination_ids.length} destinos` : '-'}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Editar RegiÃ³n' : 'Nueva RegiÃ³n'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>DescripciÃ³n</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Destinos que la integran</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-1">
                {destinations?.map((d: any) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedDestIds.includes(d.id)}
                      onCheckedChange={() => toggleDest(d.id)}
                    />
                    {d.name}
                  </label>
                ))}
                {(!destinations || destinations.length === 0) && (
                  <p className="text-xs text-gray-400">No hay destinos disponibles</p>
                )}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full">
              <Save className="mr-2 h-4 w-4" />{saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
