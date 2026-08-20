'use client';

import React from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useAuth } from '@/sdk/auth/AuthContext';
import { useAuthHeaders } from '@/sdk/hooks/useAuthHeaders';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Shield,
  Activity,
  User,
  ArrowUpRight,
  TrendingUp,
  LayoutDashboard,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const getAuthHeaders = useAuthHeaders();

  // Fetch users count dynamically
  const { data: users } = useSWR('dashboard-users', () => {
    const headers = getAuthHeaders();
    return fetch('/api/users/users', { headers })
      .then((r) => r.json())
      .then((d) => {
        const list = d?.Items || d?.items || d;
        return Array.isArray(list) ? list : [];
      })
      .catch(() => []);
  });

  // Fetch roles count dynamically
  const { data: roles } = useSWR('dashboard-roles', () => {
    const headers = getAuthHeaders();
    return fetch('/api/users/roles', { headers })
      .then((r) => r.json())
      .then((d) => {
        const list = d?.Items || d?.items || d;
        return Array.isArray(list) ? list : [];
      })
      .catch(() => []);
  });

  const activeUsersCount = users ? users.filter((u: any) => u.is_active || u.IsActive || u.isActive).length : 0;
  const totalUsersCount = users ? users.length : 0;
  const rolesCount = roles ? roles.length : 0;

  const userName = user?.name || user?.email || 'Admin';

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-content-enter">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">¡Hola de nuevo, {userName}!</h1>
            <p className="mt-2 text-indigo-100 max-w-xl">
              Bienvenido al panel de administración de tu plataforma base. Desde acá podés gestionar accesos y roles del sistema.
            </p>
          </div>
          <Link href="/app/perfil" passHref>
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-md border-none transition-all duration-200 hover:translate-y-[-2px]">
              Ver mi perfil
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Usuarios Activos
            </CardTitle>
            <div className="rounded-full bg-blue-50 p-2.5 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{activeUsersCount}</div>
            <p className="mt-1 text-xs text-slate-500">
              De un total de {totalUsersCount} registrados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Roles en Sistema
            </CardTitle>
            <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-600">
              <Shield className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{rolesCount}</div>
            <p className="mt-1 text-xs text-slate-500">
              Perfiles de acceso configurados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Estado Backend
            </CardTitle>
            <div className="rounded-full bg-green-50 p-2.5 text-green-600">
              <Activity className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">Operativo</div>
            <p className="mt-1 text-xs text-slate-500">
              API Gateway y microservicios online
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Quick Actions */}
      <Card className="shadow-sm border border-slate-100 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Accesos Rápidos</CardTitle>
          <CardDescription>Atajos a las vistas principales</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Link href="/app/user" passHref className="w-full">
            <Button variant="outline" className="w-full justify-start h-16 gap-3 hover:bg-blue-50 hover:text-blue-700 transition-colors">
              <Users className="h-5 w-5 text-blue-500" />
              Administrar Usuarios
            </Button>
          </Link>
          <Link href="/app/role" passHref className="w-full">
            <Button variant="outline" className="w-full justify-start h-16 gap-3 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
              <Shield className="h-5 w-5 text-indigo-500" />
              Ver Roles y Permisos
            </Button>
          </Link>
          <Link href="/app/perfil" passHref className="w-full">
            <Button variant="outline" className="w-full justify-start h-16 gap-3 hover:bg-slate-50 transition-colors">
              <User className="h-5 w-5 text-slate-500" />
              Configurar mi Perfil
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
