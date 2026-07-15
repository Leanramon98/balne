'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  getSubnationalLevels,
  createSubnationalLevel,
  updateSubnationalLevel,
  deleteSubnationalLevel,
} from '@/sdk/api/evaluations-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { SimpleCrudDialog } from '@/components/molecules/SimpleCrudDialog';
import type { SubnationalLevel } from '@/types';

export default function NivelesTab() {
  const { data: levels, isLoading, mutate } = useSWR('subnational-levels', () => getSubnationalLevels());
  const [editItem, setEditItem] = useState<SubnationalLevel | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Niveles Subnacionales</CardTitle>
          <Button size="sm" onClick={() => { setEditItem(null); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Nuevo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Nombre</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">País</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels?.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.name}</TableCell>
                <TableCell>{l.country || '-'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => { setEditItem(l); setOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={async () => { await deleteSubnationalLevel(l.id); mutate(); }}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <SimpleCrudDialog
        open={open} onOpenChange={setOpen}
        item={editItem}
        fields={[
          { key: 'name', label: 'Nombre' },
          { key: 'country', label: 'País' },
        ]}
        onSave={async (data) => {
          if (editItem) await updateSubnationalLevel(editItem.id, data);
          else await createSubnationalLevel(data);
          mutate();
        }}
      />
    </Card>
  );
}
