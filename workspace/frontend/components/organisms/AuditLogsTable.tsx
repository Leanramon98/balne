'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, FileDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AuditLogsTableProps {
  logs: Record<string, unknown>[];
  isLoading: boolean;
}

/** Format ISO date string to locale date + time */
function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Safely extract a field value from an object supporting PascalCase and camelCase */
function val(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return '-';
}

export function AuditLogsTable({ logs, isLoading }: AuditLogsTableProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter((log) =>
      Object.values(log).some((v) =>
        String(v ?? '').toLowerCase().includes(q),
      ),
    );
  }, [logs, search]);

  return (
    <div className="space-y-3">
      {/* Search + Export bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar en historial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" disabled>
                <FileDown className="mr-2 h-4 w-4" />Exportar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Próximamente disponible</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-48 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {search ? 'No se encontraron registros con ese criterio.' : 'No hay registros de acceso.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Fecha y hora</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Perfil</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acción</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log, idx) => (
                <TableRow key={(log.ID ?? log.id ?? idx) as string}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDateTime(val(log, 'ChangedAt', 'changed_at', 'created_at', 'CreatedAt'))}
                  </TableCell>
                  <TableCell className="text-sm">
                    {val(log, 'ChangedBy', 'changed_by', 'user_name', 'UserName', 'email', 'Email')}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm capitalize">
                      {val(log, 'Action', 'action')}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                    {val(log, 'EntityType', 'entity_type')}
                    {log.EntityID || log.entity_id
                      ? ` #${String(log.EntityID ?? log.entity_id ?? '').slice(0, 8)}`
                      : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
