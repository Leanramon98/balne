'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { getRoles } from '@/sdk/api/users-api';
import { useAuthHeaders } from '@/sdk/hooks/useAuthHeaders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus, Edit, Trash2, Save,
  Eye, KeyRound, CheckSquare, XSquare, Mail,
} from 'lucide-react';

export default function UsersTab() {
  const getAuthHeaders = useAuthHeaders();

  const { data: users, isLoading, mutate } = useSWR('users-config', () => {
    const headers = getAuthHeaders();
    return fetch('/api/users/users', { headers }).then(r => {
      if (!r.ok) throw new Error('Failed to fetch users');
      return r.json();
    }).then(d => {
      const list = d?.Items || d?.items || d;
      return Array.isArray(list) ? list : [];
    });
  });

  const { data: roleList } = useSWR('users-config-roles', () => getRoles());
  const roleMap = new Map(
    (Array.isArray(roleList) ? roleList : []).map((r: any) => [r.ID, r.Name])
  );

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allIds = (users || []).map((u: any) => String(u.ID || u.id));
  const allSelected = allIds.length > 0 && selectedIds.size === allIds.length;
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkActivate = async () => {
    if (!window.confirm(`¿Activar ${selectedIds.size} usuario(s)?`)) return;
    try {
      const headers = getAuthHeaders();
      const userMap = new Map((users || []).map((u: any) => [String(u.ID || u.id), u]));
      await Promise.all(
        Array.from(selectedIds).map(id => {
          const u = userMap.get(id);
          if (!u) return Promise.resolve();
          return fetch(`/api/users/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({
              full_name: u.full_name || u.FullName || u.fullName,
              email: u.email || u.Email,
              role_id: u.role_id || u.RoleID || u.roleId,
              is_active: true,
            }),
          });
        })
      );
      setSelectedIds(new Set());
      mutate();
    } catch { alert('Error al activar usuarios'); }
  };

  const handleBulkDeactivate = async () => {
    if (!window.confirm(`¿Desactivar ${selectedIds.size} usuario(s)?`)) return;
    try {
      const headers = getAuthHeaders();
      const userMap = new Map((users || []).map((u: any) => [String(u.ID || u.id), u]));
      await Promise.all(
        Array.from(selectedIds).map(id => {
          const u = userMap.get(id);
          if (!u) return Promise.resolve();
          return fetch(`/api/users/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({
              full_name: u.full_name || u.FullName || u.fullName,
              email: u.email || u.Email,
              role_id: u.role_id || u.RoleID || u.roleId,
              is_active: false,
            }),
          });
        })
      );
      setSelectedIds(new Set());
      mutate();
    } catch { alert('Error al desactivar usuarios'); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Eliminar ${selectedIds.size} usuario(s)? Esta acción no se puede deshacer.`)) return;
    try {
      const headers = getAuthHeaders();
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/users/users/${id}`, { method: 'DELETE', headers })
        )
      );
      setSelectedIds(new Set());
      mutate();
    } catch { alert('Error al eliminar usuarios'); }
  };



  const openCreate = () => {
    setEditingUser(null);
    setUserDialogOpen(true);
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    setUserDialogOpen(true);
  };

  const handleToggleActive = async (u: any) => {
    const id = u.ID || u.id;
    const isActive = !(u.IsActive ?? u.is_active ?? true);
    const name = u.full_name || u.FullName || u.fullName || u.email || u.Email || 'usuario';
    const action = isActive ? 'activar' : 'desactivar';
    if (!window.confirm(`¿${action} al usuario "${name}"?`)) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`/api/users/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          full_name: u.full_name || u.FullName || u.fullName,
          email: u.email || u.Email,
          role_id: u.role_id || u.RoleID || u.roleId,
          is_active: isActive,
        }),
      });
      mutate();
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };



  const handleDeleteUser = async (u: any) => {
    const id = u.ID || u.id;
    const name = u.full_name || u.FullName || u.fullName || u.email || u.Email || 'usuario';
    if (!window.confirm(`¿Eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`/api/users/users/${id}`, { method: 'DELETE', headers });
      mutate();
    } catch {
      alert('Error al eliminar usuario');
    }
  };

  const fmtDate = (u: any): string => {
    const raw = u.CreatedAt || u.created_at || u.createdAt;
    if (!raw) return '-';
    try {
      return new Date(raw).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return '-'; }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Usuarios</CardTitle>
          <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo Usuario</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
              </DialogHeader>
              <UserForm
                user={editingUser}
                onSaved={() => { setUserDialogOpen(false); mutate(); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {someSelected && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-medium text-blue-800">
              {selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <div className="flex-1" />
            <Button size="sm" variant="outline" className="border-green-400 text-green-700 hover:bg-green-50" onClick={handleBulkActivate}>
              <CheckSquare className="mr-1 h-4 w-4" />Activar
            </Button>
            <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50" onClick={handleBulkDeactivate}>
              <XSquare className="mr-1 h-4 w-4" />Desactivar
            </Button>
            <Button size="sm" variant="outline" className="border-red-400 text-red-700 hover:bg-red-50" onClick={handleBulkDelete}>
              <Trash2 className="mr-1 h-4 w-4" />Eliminar
            </Button>
          </div>
        )}
        {isLoading ? (
          <div className="p-4"><Skeleton className="h-48 w-full" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-zinc-50 w-10 py-3 px-4 border-b border-zinc-200">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Seleccionar todos"
                    />
                  </TableHead>
                  <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Fecha</TableHead>
                  <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Nombre</TableHead>
                  <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Email</TableHead>
                  <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Perfil</TableHead>
                  <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Alta/Baja</TableHead>
                  <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u: any) => {
                  const userId = u.ID || u.id;
                  return (
                    <TableRow key={userId}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedIds.has(String(userId))}
                          onCheckedChange={() => toggleSelect(String(userId))}
                          aria-label={`Seleccionar ${u.full_name || u.FullName || u.fullName || u.email}`}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{fmtDate(u)}</TableCell>
                      <TableCell className="font-medium">{u.full_name || u.FullName || u.fullName || '-'}</TableCell>
                      <TableCell className="text-sm">{u.email || u.Email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {roleMap.get(u.role_id || u.RoleID || u.roleId) || u.role_id || u.RoleID || u.roleId || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={u.IsActive !== false && u.is_active !== false}
                          onCheckedChange={() => handleToggleActive(u)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Ver detalle" onClick={() => setDetailUser(detailUser === u ? null : u)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(u)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Eliminar" onClick={() => handleDeleteUser(u)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        {detailUser === u && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md text-xs space-y-1">
                            <p><strong>ID:</strong> {userId}</p>
                            <p><strong>Teléfono:</strong> {u.phone || u.Phone || u.telefono || u.Telefono || '-'}</p>
                            <p><strong>Creado:</strong> {fmtDate(u)}</p>
                            <p><strong>Actualizado:</strong> {u.updated_at || u.UpdatedAt ? fmtDate({ CreatedAt: u.updated_at || u.UpdatedAt }) : '-'}</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pwd = '';
  for (let i = 0; i < 14; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

function UserForm({ user, onSaved }: {
  user: any;
  onSaved: () => void;
}) {
  const getAuthHeaders = useAuthHeaders();
  const [roleId, setRoleId] = useState(user?.role_id || user?.RoleID || user?.roleId || '');
  const [isActive, setIsActive] = useState(user?.is_active ?? user?.IsActive ?? true);
  const [fullName, setFullName] = useState(user?.full_name || user?.FullName || user?.fullName || '');
  const [email, setEmail] = useState(user?.email || user?.Email || '');
  const [phone, setPhone] = useState(user?.phone || user?.Phone || user?.telefono || user?.Telefono || '');
  const [password, setPassword] = useState(user ? '' : generatePassword());
  const [saving, setSaving] = useState(false);

  const { data: roleList } = useSWR('user-form-roles', () => getRoles());
  const roles = roleList || [];

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      alert('Nombre y Email son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const body: Record<string, unknown> = {
        full_name: fullName.trim(),
        email: email.trim(),
        role_id: roleId,
        is_active: isActive,
        phone: phone.trim() || undefined,
      };

      if (user) {
        if (password) {
          body.password = password;
        }
        await fetch(`/api/users/users/${user.id || user.ID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(body),
        });
      } else {
        body.password = password;
        const res = await fetch('/api/users/users', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }
      }
      onSaved();
    } catch (err) {
      alert('Error al guardar usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Perfil</Label>
        <Select value={roleId} onValueChange={setRoleId}>
          <SelectTrigger><SelectValue placeholder="Seleccionar perfil" /></SelectTrigger>
          <SelectContent>
            {roles.map((r: any) => (
              <SelectItem key={r.ID} value={r.ID}>{r.Name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Estado</Label>
        <Select value={isActive ? 'alta' : 'baja'} onValueChange={(v) => setIsActive(v === 'alta')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Nombre *</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre completo" />
      </div>

      <div className="space-y-2">
        <Label>Email *</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" />
      </div>

      <div className="space-y-2">
        <Label>Teléfono</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 1234-5678" />
      </div>

      {user ? (
        <div className="space-y-2 border-t pt-4">
          <Label>Seguridad</Label>
          {password ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={password} readOnly className="font-mono text-sm bg-gray-50" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPassword(generatePassword())}
                  className="shrink-0"
                >
                  Regenerar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPassword('')}
                  className="shrink-0 text-red-500"
                >
                  Cancelar
                </Button>
              </div>
              <p className="text-xs text-amber-600 font-medium">Copiala antes de guardar — no se mostrará después y se forzará al usuario a cambiarla.</p>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPassword(generatePassword())}
              className="w-full"
            >
              Generar nueva contraseña
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Contraseña (generada automáticamente)</Label>
          <div className="flex gap-2">
            <Input value={password} readOnly className="font-mono text-sm bg-gray-50" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPassword(generatePassword())}
              className="shrink-0"
            >
              Regenerar
            </Button>
          </div>
          <p className="text-xs text-gray-400">Copiala antes de guardar — no se mostrará después.</p>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="mr-2 h-4 w-4" />{saving ? 'Guardando...' : (user ? 'Actualizar Usuario' : 'Crear Usuario')}
      </Button>
    </div>
  );
}
