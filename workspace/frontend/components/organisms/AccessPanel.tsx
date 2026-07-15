'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  getEvaluationUsers,
  grantEvaluationAccess,
  revokeEvaluationAccess,
} from '@/sdk/api/evaluations-api';
import { AccessRow } from '@/components/molecules/AccessRow';
import { EmptyState } from '@/components/atoms/EmptyState';
import { Button } from '@/components/ui/button';
import { getAuthHeaders, getUserRoles } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { UserPlus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AccessLevel } from '@/types';

interface AccessPanelProps {
  evaluationId: string;
}

const ACCESS_LEVELS: { value: AccessLevel; label: string }[] = [
  { value: 'solo_lectura', label: 'Solo Lectura' },
  { value: 'carga', label: 'Carga' },
  { value: 'evaluador', label: 'Evaluador' },
  { value: 'administracion', label: 'Administración' },
];

function AccessPanelSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function AccessPanel({ evaluationId }: AccessPanelProps) {
  const { data: users, isLoading, error, mutate } = useSWR(
    evaluationId ? `evaluation/${evaluationId}/users` : null,
    () => getEvaluationUsers(evaluationId),
  );

  // Load all users for the searchable dropdown
  const { data: allUsers } = useSWR('all-users-access', async () => {
    const headers = getAuthHeaders();
    const res = await fetch('/api/users/users', { headers });
    if (!res.ok) throw new Error('Failed to fetch users');
    const d = await res.json();
    return Array.isArray(d?.Items || d?.items || d) ? (d?.Items || d?.items || d) : [];
  });

  const [grantOpen, setGrantOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newAccessLevel, setNewAccessLevel] = useState<AccessLevel>('solo_lectura');
  const [userSearch, setUserSearch] = useState('');
  const [granting, setGranting] = useState(false);

  // Filter users by search text
  const filteredUsers = (allUsers || []).filter((u: any) => {
    const name = (u.FullName || u.fullName || '').toLowerCase();
    const email = (u.Email || u.email || '').toLowerCase();
    const search = userSearch.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  const selectedUser = (allUsers || []).find((u: any) => (u.ID || u.id) === newUserId);

  const handleGrant = async () => {
    if (!newUserId.trim()) {
      toast.error('Debe seleccionar un usuario');
      return;
    }
    setGranting(true);
    try {
      await grantEvaluationAccess(evaluationId, newUserId.trim(), newAccessLevel);
      toast.success('Acceso concedido correctamente');
      setNewUserId('');
      setNewAccessLevel('solo_lectura');
      setUserSearch('');
      setGrantOpen(false);
      await mutate();
    } catch (err: any) {
      toast.error(err.message || 'Error al conceder acceso');
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      await revokeEvaluationAccess(evaluationId, userId);
      toast.success('Acceso revocado correctamente');
      await mutate();
    } catch (err: any) {
      toast.error(err.message || 'Error al revocar acceso');
    }
  };

  const userList = users ?? [];
  const userMap = new Map<string, any>((allUsers || []).map((u: any) => [u.ID || u.id, u]));

  const roles = getUserRoles();
  const canManage = roles.includes('admin') || roles.includes('admin_destino');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Usuarios con Acceso</CardTitle>
          {canManage && (
            <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Conceder Acceso
                </Button>
              </DialogTrigger>
              <DialogContent className="overflow-visible">
              <DialogHeader>
                <DialogTitle>Conceder Acceso</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="user-search">Buscar Usuario</Label>
                  <Input
                    id="user-search"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nombre o email..."
                  />
                  {userSearch && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full max-h-48 overflow-y-auto border rounded-md bg-white shadow-lg">
                      {filteredUsers.map((u: any) => {
                        const uid = u.ID || u.id;
                        const name = u.FullName || u.fullName || '';
                        const email = u.Email || u.email || '';
                        return (
                          <div
                            key={uid}
                            className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 flex justify-between items-center ${
                              newUserId === uid ? 'bg-blue-50 font-medium' : ''
                            }`}
                            onClick={() => {
                              setNewUserId(uid);
                              setUserSearch(name || email);
                            }}
                          >
                            <span>{name || email}</span>
                            <span className="text-xs text-gray-400">{email}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {selectedUser && (
                    <p className="text-xs text-green-600">
                      Seleccionado: {selectedUser.FullName || selectedUser.fullName || selectedUser.Email || selectedUser.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-level">Nivel de Acceso</Label>
                  <Select
                    value={newAccessLevel}
                    onValueChange={(v) => setNewAccessLevel(v as AccessLevel)}
                  >
                    <SelectTrigger id="access-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGrant}
                  disabled={granting || !newUserId}
                  className="w-full"
                >
                  {granting ? 'Concediendo...' : 'Conceder'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4">
            <AccessPanelSkeleton />
          </div>
        ) : error ? (
          <div className="p-4">
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="Error al cargar accesos"
              description={error.message || 'No se pudieron cargar los usuarios.'}
            />
          </div>
        ) : userList.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="Sin usuarios con acceso"
              description="Conceda acceso a usuarios para que puedan participar en esta evaluación."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Usuario</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Email</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Nivel de acceso</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200 w-20 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userList.map((u) => {
                  const userInfo = userMap.get(String(u.user_id));
                  return (
                    <AccessRow
                      key={u.user_id}
                      access={u}
                      userName={u.user_name || userInfo?.FullName || userInfo?.full_name || u.user_id}
                      userEmail={u.user_email || userInfo?.Email || userInfo?.email || '-'}
                      onRevoke={handleRevoke}
                      isImplicit={u.is_implicit}
                    />
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

