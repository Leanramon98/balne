'use client';

import { ActivityItem } from '@/components/atoms/ActivityItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Info } from 'lucide-react';

// Minimal local type mirroring the audit log shape
interface AuditLogItem {
  id: string;
  changed_at: string;
  action: string;
  changed_by_name?: string;
}

interface ActivitySectionProps {
  logs: AuditLogItem[];
  isLoading: boolean;
  error: Error | null;
}

export function ActivitySection({ logs, isLoading, error }: ActivitySectionProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-zinc-900">Actividad reciente</h2>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 p-6 text-center">
          <Info className="h-6 w-6 text-zinc-300 mb-2" />
          <p className="text-sm text-zinc-500">
            La actividad reciente no está disponible en este momento
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Volverá a intentar cargar automáticamente
          </p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 p-6 text-center">
          <Activity className="h-6 w-6 text-zinc-300 mb-2" />
          <p className="text-sm text-zinc-500">Sin actividad reciente</p>
          <p className="text-xs text-zinc-400 mt-1">
            Las acciones más recientes aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <ActivityItem
              key={log.id}
              timestamp={log.changed_at}
              action={log.action}
              user={log.changed_by_name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
