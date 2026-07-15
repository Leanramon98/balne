'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { SimpleCrudDialog } from '@/components/molecules/SimpleCrudDialog';
import {
  getResponsibleAreas, createResponsibleArea, updateResponsibleArea, deleteResponsibleArea,
} from '@/sdk/api/evaluations-api';
import type { ResponsibleArea } from '@/types';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function AreasTab() {
  const { data: areas, isLoading, mutate } = useSWR('areas-config', () => getResponsibleAreas());
  const [editItem, setEditItem] = useState<ResponsibleArea | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Áreas Responsables</CardTitle>
          <Button size="sm" onClick={() => { setEditItem(null); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Nueva
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Nombre</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Descripción</TableHead>
              <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas?.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.name}</TableCell>
                <TableCell className="text-sm text-gray-500">{a.description || '-'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => { setEditItem(a); setOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={async () => { await deleteResponsibleArea(a.id); mutate(); }}>
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
          { key: 'name', label: 'Nombre', type: 'text' },
          { key: 'description', label: 'Descripción', type: 'text' },
        ]}
        onSave={async (data) => {
          if (editItem) await updateResponsibleArea(editItem.id, data);
          else await createResponsibleArea(data);
          mutate();
        }}
      />
    </Card>
  );
}
