'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { getAxes, updateAxis, deleteAxis } from '@/sdk/api/evaluations-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function EjesTab() {
  const { data: axes, isLoading, mutate } = useSWR('axes', () => getAxes());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleUpdatePercent = async (id: string, objective_percent: number) => {
    try {
      await updateAxis(id, { objective_percent });
      mutate();
    } catch (err) {
      alert('Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAxis(deleteId);
      mutate();
    } catch {
      alert('Error al eliminar eje');
    }
    setDeleteId(null);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Ejes</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Eje</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">% Objetivo</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Orden</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {axes?.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.axis?.toUpperCase()}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={a.objective_percent}
                    onChange={(e) => handleUpdatePercent(a.id, Number(e.target.value))}
                    className="w-20 h-8 text-sm"
                  />
                </TableCell>
                <TableCell>{a.sort_order}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(a.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="¿Eliminar eje?"
        description={`Esta acción eliminará "${axes?.find((a) => a.id === deleteId)?.axis?.toUpperCase()}\" de forma permanente.`}
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
      />
    </Card>
  );
}
