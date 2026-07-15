'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { ExternalLink, FileText, Unlink } from 'lucide-react';
import { getEvidence, unlinkIndicatorFromAction } from '@/sdk/api/evaluations-api';
import { getActionStatusLabel } from '@/lib/display-names';
import { EvidenceModal } from '@/components/molecules/EvidenceModal';
import type { Action } from '@/types';

const ACTION_STATUS_COLORS: Record<string, string> = {
  idea: 'bg-gray-100 text-gray-700',
  en_planificacion: 'bg-blue-100 text-blue-700',
  en_ejecucion: 'bg-amber-100 text-amber-700',
  finalizada: 'bg-green-100 text-green-700',
  descartada: 'bg-red-100 text-red-700',
};

interface LinkedActionRowProps {
  action: Action;
  evaluationId: string;
  indicatorId: string;
  onRefresh: () => void;
}

export function LinkedActionRow({ action, evaluationId, indicatorId, onRefresh }: LinkedActionRowProps) {
  const { data: evidences } = useSWR(
    ['action-evidence', action.id],
    () => getEvidence(action.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const handleUnlink = async () => {
    if (!window.confirm(`¿Desvincular "${action.name}" de este indicador?`)) return;
    setUnlinking(true);
    try {
      await unlinkIndicatorFromAction(action.id, indicatorId, evaluationId);
      onRefresh();
    } catch {
      alert('Error al desvincular la acción');
    } finally {
      setUnlinking(false);
    }
  };

  const hasEvidences = evidences && evidences.length > 0;
  const statusColor = ACTION_STATUS_COLORS[action.status] || 'bg-gray-100';

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <span>{action.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => window.open(`/acciones/${action.id}?evaluation_id=${evaluationId}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
        <TableCell>
          <Badge className={`text-xs ${statusColor}`}>
            {getActionStatusLabel(action.status)}
          </Badge>
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-sm h-auto px-2 py-1"
            onClick={() => setEvidenceModalOpen(true)}
          >
            <FileText className="h-4 w-4 text-gray-400" />
            {hasEvidences ? evidences!.length : 0}
          </Button>
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            title="Desvincular acción"
            disabled={unlinking}
            onClick={handleUnlink}
          >
            <Unlink className="h-4 w-4 text-red-500" />
          </Button>
        </TableCell>
      </TableRow>

      <EvidenceModal
        actionId={action.id}
        actionName={action.name}
        evaluationId={evaluationId}
        open={evidenceModalOpen}
        onOpenChange={setEvidenceModalOpen}
        onEvidenceChange={onRefresh}
      />
    </>
  );
}
