'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus, Edit, Trash2, Save,
} from 'lucide-react';
import {
  getMemberTypes, createMemberType, updateMemberType, deleteMemberType,
} from '@/sdk/api/evaluations-api';
import type { MemberType } from '@/types';

export default function MiembrosTab() {
  const { data: types, isLoading, mutate } = useSWR('member-types', () => getMemberTypes());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MemberType | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<MemberType | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setName('');
    setDialogOpen(true);
  };

  const openEdit = (item: MemberType) => {
    setEditItem(item);
    setName(item.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateMemberType(editItem.id, { name: name.trim() });
      } else {
        await createMemberType({ name: name.trim() });
      }
      setDialogOpen(false);
      mutate();
    } catch (err) {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: MemberType) => {
    try {
      await deleteMemberType(item.id);
      mutate();
    } catch (err) {
      alert('Error al eliminar');
    }
    setDeleteConfirm(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tipos de Miembro</CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />Nuevo Tipo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Nombre</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types?.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(t)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Editar Tipo' : 'Nuevo Tipo de Miembro'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Miembro Pleno" />
            </div>
            <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full">
              <Save className="mr-2 h-4 w-4" />{saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Â¿Eliminar tipo de miembro?</DialogTitle>
            <DialogDescription>
              Esta acciÃ³n eliminarÃ¡ &quot;{deleteConfirm?.name}&quot; de forma permanente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
