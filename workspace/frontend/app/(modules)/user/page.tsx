'use client';

import UsersTab from '@/components/organisms/config/UsersConfig';

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-content-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administración de Usuarios</h1>
        <p className="text-slate-500">Gestioná los usuarios del sistema, sus roles, accesos e información de login.</p>
      </div>
      <UsersTab />
    </div>
  );
}
