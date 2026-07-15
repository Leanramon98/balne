'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import useSWR from 'swr';
import { getAdminScopes, createAdminScope, updateAdminScope, deleteAdminScope } from '@/sdk/api/evaluations-api';
import { getScopeName } from '@/lib/scope-translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { ScopeIcon } from '@/components/atoms/ScopeIcon';
import { ICON_MAP, AVAILABLE_ICON_NAMES } from '@/lib/scope-icons';
import { Plus, Edit, Save, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Scope, AxisEnum } from '@/types';

export default function ScopesTab() {
  const { data: scopes, isLoading, mutate } = useSWR('admin-scopes', () => getAdminScopes());
  const locale = useLocale();
  const [editScope, setEditScope] = useState<Scope | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<Scope | null>(null);

  const handleDelete = async () => {
    if (!deleteScope) return;
    try {
      await deleteAdminScope(deleteScope.id);
      mutate();
    } catch (err) {
      alert('Error al eliminar ámbito');
    }
    setDeleteScope(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Ámbitos</CardTitle>
          <Button size="sm" onClick={() => { setEditScope(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Nuevo Ámbito
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Icono</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acrónimo</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Nombre</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Descripción</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Eje</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Orden</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scopes?.map((s) => (
              <TableRow key={s.id}>
                <TableCell><ScopeIcon icon={s.icon} axis={s.axis} acronym={s.acronym} size="sm" /></TableCell>
                <TableCell className="font-mono">{s.acronym}</TableCell>
                <TableCell>{getScopeName(s.acronym, locale, s.name)}</TableCell>
                <TableCell className="max-w-xs truncate text-zinc-600">{s.description || <span className="text-zinc-300">—</span>}</TableCell>
                <TableCell>{s.axis?.toUpperCase()}</TableCell>
                <TableCell>{s.sort_order}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteScope(s)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditScope(s); setDialogOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editScope ? 'Editar Ámbito' : 'Nuevo Ámbito'}</DialogTitle></DialogHeader>
          <ScopeForm scope={editScope} onSaved={() => { setDialogOpen(false); mutate(); }} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteScope}
        onOpenChange={(o) => { if (!o) setDeleteScope(null); }}
        title="¿Eliminar ámbito?"
        description={`Esta acción eliminará "${getScopeName(deleteScope?.acronym, locale, deleteScope?.name ?? '')}" de forma permanente.`}
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
      />
    </Card>
  );
}

function ScopeForm({ scope, onSaved }: { scope: Scope | null; onSaved: () => void }) {
  const [name, setName] = useState(scope?.name || '');
  const [acronym, setAcronym] = useState(scope?.acronym || '');
  const [axis, setAxis] = useState<string>(scope?.axis || 'gob');
  const [icon, setIcon] = useState(scope?.icon || '');
  const [description, setDescription] = useState(scope?.description || '');
  const [sortOrder, setSortOrder] = useState(scope?.sort_order || 0);
  const [saving, setSaving] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const filteredIcons = AVAILABLE_ICON_NAMES.filter((name) =>
    name.toLowerCase().includes(iconSearch.toLowerCase()),
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      if (scope) {
        await updateAdminScope(scope.id, { name, acronym, axis: axis as AxisEnum, icon, description, sort_order: sortOrder });
      } else {
        await createAdminScope({ name, acronym, axis: axis as AxisEnum, icon, description, sort_order: sortOrder });
      }
      onSaved();
    } catch (err) {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Acrónimo</Label>
          <Input value={acronym} onChange={(e) => setAcronym(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Eje</Label>
          <Select value={axis} onValueChange={setAxis}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gob">GOB</SelectItem>
              <SelectItem value="inn">INN</SelectItem>
              <SelectItem value="tec">TEC</SelectItem>
              <SelectItem value="sost">SOST</SelectItem>
              <SelectItem value="acc">ACC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Icon selector */}
      <div className="space-y-2">
        <Label>Icono</Label>
        <div className="flex items-center gap-3 mb-2">
          <ScopeIcon icon={icon} axis={axis} acronym={acronym} size="md" />
          <span className="text-sm text-zinc-500 font-mono">
            {icon || <span className="text-zinc-300">—</span>}
          </span>
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            placeholder="Buscar icono..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-lg p-2">
          <div className="grid grid-cols-8 gap-1">
            {filteredIcons.map((name) => {
              const LucideIcon = ICON_MAP[name];
              const isSelected = icon === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  className={cn(
                    'flex items-center justify-center h-9 w-9 rounded-md border transition-all',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-600 ring-1 ring-blue-500'
                      : 'border-transparent text-zinc-600 hover:bg-zinc-100 hover:border-zinc-200',
                  )}
                  title={name}
                >
                  <LucideIcon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-4">
              No se encontraron iconos para &ldquo;{iconSearch}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="mr-2 h-4 w-4" />{saving ? 'Guardando...' : 'Guardar'}
      </Button>
    </div>
  );
}
