'use client';

import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Trash2 } from 'lucide-react';
import type { EvaluationUser } from '@/types';

interface AccessRowProps {
  access: EvaluationUser;
  userName: string;
  userEmail: string;
  onRevoke: (accessId: string) => void;
  isImplicit?: boolean;
}

const ACCESS_LABELS: Record<string, string> = {
  solo_lectura: 'Solo Lectura',
  carga: 'Carga',
  evaluador: 'Evaluador',
  administracion: 'Administración',
};

export function AccessRow({ access, userName, userEmail, onRevoke, isImplicit = false }: AccessRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRevoke = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    onRevoke(access.user_id);
    setConfirmOpen(false);
  };

  return (
    <>
      <TableRow>
        <TableCell>{userName}</TableCell>
        <TableCell className="text-sm text-zinc-500">{userEmail}</TableCell>
        <TableCell>
          <Badge variant="outline">
            {ACCESS_LABELS[access.access_level] || access.access_level}
            {isImplicit && <span className="ml-1 text-xs text-muted-foreground">(Implícito)</span>}
          </Badge>
        </TableCell>
        <TableCell className="w-20">
          {!isImplicit && (
            <Button variant="ghost" size="icon" onClick={handleRevoke} title="Revocar acceso">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </TableCell>
      </TableRow>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Revocar acceso"
        description="¿Está seguro de revocar el acceso a este usuario? Perderá todos los permisos asociados a esta evaluación."
        onConfirm={handleConfirm}
        confirmText="Revocar"
        variant="destructive"
      />
    </>
  );
}
