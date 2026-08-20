'use client';

import AccesosTab from '@/components/organisms/config/AccesosConfig';

export default function AuditLogPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-content-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registro de Auditoría</h1>
        <p className="text-slate-500">Visualizá el historial de accesos y las acciones realizadas por los usuarios en el sistema.</p>
      </div>
      <AccesosTab />
    </div>
  );
}
