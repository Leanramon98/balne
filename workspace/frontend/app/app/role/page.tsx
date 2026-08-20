'use client';

import React from 'react';
import useSWR from 'swr';
import { getRoles } from '@/sdk/api/users-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Check, X, Info } from 'lucide-react';

export default function RolesPage() {
  const { data: roles, isLoading, error } = useSWR('roles-page-list', () => getRoles());

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-content-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles y Permisos</h1>
        <p className="text-slate-500">Visualizá los roles de acceso configurados en el sistema y sus respectivos alcances.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-sm border border-slate-100">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 border border-dashed rounded-xl bg-red-50 text-red-700">
          Ocurrió un error al obtener la lista de roles del backend.
        </div>
      ) : !roles || roles.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl text-slate-500">
          No hay roles configurados en la base de datos.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {roles.map((role) => {
            // Parse permissions
            let permissions: any = {};
            if (role.Permissions) {
              try {
                permissions = typeof role.Permissions === 'string' 
                  ? JSON.parse(role.Permissions) 
                  : role.Permissions;
              } catch {
                permissions = {};
              }
            }

            const scope = permissions.access_scope || permissions.AccessScope || 'organization';
            const canManage = permissions.can_manage_users || permissions.CanManageUsers;
            const canWrite = permissions.can_write_values || permissions.CanWriteValues;

            return (
              <Card key={role.ID} className="shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-indigo-500" />
                      {role.Name}
                    </CardTitle>
                    <CardDescription className="mt-1">{role.Description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-slate-50 text-slate-600 font-semibold border-slate-200">
                    ID: {role.ID.slice(0, 8)}...
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 border-t border-slate-50">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Configuración de Permisos
                  </h4>
                  <div className="space-y-3">
                    {/* Access Scope */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">Alcance de acceso (Scope)</span>
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none capitalize font-semibold">
                        {scope}
                      </Badge>
                    </div>

                    {/* Manage Users */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">Gestionar usuarios del sistema</span>
                      {canManage ? (
                        <span className="flex items-center gap-1.5 text-green-600 font-semibold text-xs bg-green-50 px-2 py-0.5 rounded-full">
                          <Check className="h-3 w-3" /> Habilitado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400 font-medium text-xs bg-slate-50 px-2 py-0.5 rounded-full">
                          <X className="h-3 w-3" /> Restringido
                        </span>
                      )}
                    </div>

                    {/* Write Values */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">Modificar valores/datos</span>
                      {canWrite ? (
                        <span className="flex items-center gap-1.5 text-green-600 font-semibold text-xs bg-green-50 px-2 py-0.5 rounded-full">
                          <Check className="h-3 w-3" /> Habilitado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400 font-medium text-xs bg-slate-50 px-2 py-0.5 rounded-full">
                          <X className="h-3 w-3" /> Restringido
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
