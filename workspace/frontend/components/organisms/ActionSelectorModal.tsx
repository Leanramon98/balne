'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  getActions,
  linkIndicatorToAction,
} from '@/sdk/api/evaluations-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Search, Link2, AlertTriangle, Check } from 'lucide-react';
import type { Action } from '@/types';

interface ActionSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationId: string;
  indicatorId: string;
  destinationId: string;
  onSuccess?: () => void;
  /** IDs of already linked actions to exclude */
  alreadyLinkedIds?: string[];
}

export function ActionSelectorModal({
  open,
  onOpenChange,
  evaluationId,
  indicatorId,
  destinationId,
  onSuccess,
  alreadyLinkedIds = [],
}: ActionSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [linking, setLinking] = useState<string | null>(null);
  const [duplicatedIds, setDuplicatedIds] = useState<string[]>([]);

  // Reset the duplicated list when the modal opens
  useEffect(() => {
    if (open) setDuplicatedIds([]);
  }, [open]);

  const {
    data: actions,
    isLoading,
    error,
  } = useSWR(
    open ? ['selector-actions', destinationId] : null,
    () => getActions(destinationId),
  );

  // Filter actions by search text and exclude already linked
  const filtered = (actions || []).filter((a: Action) => {
    if (alreadyLinkedIds.includes(a.id)) return false;
    if (duplicatedIds.includes(a.id)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.summary || '').toLowerCase().includes(q)
    );
  });

  // Get axes as readable labels
  const getAxesDisplay = (action: Action): string => {
    if (!action.axes || action.axes.length === 0) return '-';
    return action.axes
      .map((a: string) => a.toUpperCase())
      .join(', ');
  };

  const handleLink = async (actionId: string) => {
    setLinking(actionId);
    try {
      await linkIndicatorToAction(actionId, indicatorId, evaluationId);
      toast.success('Acción vinculada correctamente');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err.message?.includes('duplicate key') || err.message?.includes('23505')) {
        toast.info('Esta acción ya estaba vinculada a este indicador');
        setDuplicatedIds((prev) => [...prev, actionId]);
      } else {
        toast.error(err.message || 'Error al vincular acción');
      }
    } finally {
      setLinking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vincular acción existente</DialogTitle>
          <DialogDescription>
            Seleccioná una acción del destino para vincularla a este indicador.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar acciones por nombre..."
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto border rounded-md">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-500">
              Error al cargar acciones: {error.message}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              {search
                ? 'No se encontraron acciones con ese nombre'
                : 'No hay acciones disponibles para vincular'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ejes</TableHead>
                  <TableHead className="w-24">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((action: Action) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {action.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {getActionStatusLabel(action.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {getAxesDisplay(action)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLink(action.id)}
                        disabled={linking === action.id}
                      >
                        {linking === action.id ? (
                          'Vinculando...'
                        ) : (
                          <>
                            <Link2 className="mr-1 h-3 w-3" />
                            Vincular
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getActionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    idea: 'Idea',
    en_planificacion: 'En planificación',
    en_ejecucion: 'En ejecución',
    finalizada: 'Finalizada',
    descartada: 'Descartada',
  };
  return labels[status] || status;
}
