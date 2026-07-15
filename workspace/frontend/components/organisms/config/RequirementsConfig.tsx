'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import {
  getAdminRequirements,
  createAdminRequirement,
  updateAdminRequirement,
  deleteAdminRequirement,
  getAdminScopes,
} from '@/sdk/api/evaluations-api';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScopeIcon } from '@/components/atoms/ScopeIcon';
import { getScopeName } from '@/lib/scope-translations';
import { getRequirementName } from '@/lib/requirement-translations';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Plus, Edit, Save, Trash2 } from 'lucide-react';

// ========== Requisitos Tab (F4-11) — CRUD with scope filter ==========
export default function RequisitosTab() {
  const locale = useLocale();
  const { data: items, isLoading, mutate } = useSWR('requisitos-config', () => getAdminRequirements());
  const { data: scopes } = useSWR('scopes-requisitos', () => getAdminScopes());
  const [scopeFilter, setScopeFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scopeId, setScopeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const filtered = (items || []).filter((r: any) =>
    scopeFilter === 'all' || r.scope_id === scopeFilter
  );

  const openCreate = () => {
    setEditItem(null); setCode(''); setName(''); setDescription(''); setScopeId(''); setOpen(true);
  };
  const openEdit = (item: any) => {
    setEditItem(item); setCode(item.code); setName(item.name); setDescription(item.description || ''); setScopeId(item.scope_id); setOpen(true);
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim() || !scopeId) return;
    setSaving(true);
    try {
      const data = { code: code.trim(), name: name.trim(), description: description.trim() || undefined, scope_id: scopeId };
      if (editItem) await updateAdminRequirement(editItem.id, data);
      else await createAdminRequirement(data);
      setOpen(false);
      mutate();
    } catch { alert('Error al guardar'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteAdminRequirement(deleteItem.id);
      mutate();
    } catch { alert('Error al eliminar'); }
    setDeleteItem(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Requisitos</CardTitle>
          <Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo Requisito</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Scope filter */}
        <div className="p-6 pb-4">
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Filtrar por ámbito" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los ámbitos</SelectItem>
              {scopes?.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.acronym} — {s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Código</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Nombre</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Descripción</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Ámbito</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item: any) => {
              const scope = scopes?.find((s: any) => s.id === item.scope_id);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.code}</TableCell>
                  <TableCell>{getRequirementName(item.code, locale, item.name)}</TableCell>
                  <TableCell className="max-w-xs truncate text-zinc-600">{item.description || <span className="text-zinc-300">—</span>}</TableCell>
                  <TableCell>
                    {scope ? (
                      <div className="flex items-center gap-2">
                        <ScopeIcon icon={scope.icon} axis={scope.axis} acronym={scope.acronym} size="sm" />
                        <span>{getScopeName(scope.acronym, locale, scope.name)}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteItem(item)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Editar Requisito' : 'Nuevo Requisito'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: REQ_01" />
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del requisito"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Ámbito *</Label>
              <Select value={scopeId} onValueChange={setScopeId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar ámbito" /></SelectTrigger>
                <SelectContent>
                  {scopes?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.acronym} — {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving || !code.trim() || !name.trim() || !scopeId} className="w-full">
              <Save className="mr-2 h-4 w-4" />{saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => { if (!o) setDeleteItem(null); }}
        title="¿Eliminar requisito?"
        description={`Esta acción eliminará "${deleteItem?.code} — ${getRequirementName(deleteItem?.code, locale, deleteItem?.name ?? '')}" de forma permanente.`}
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
      />
    </Card>
  );
}
