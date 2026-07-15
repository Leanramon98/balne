'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { TableCell, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { TypeBadge } from '@/components/atoms/TypeBadge';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { formatDate } from '@/lib/date-utils';
import { getUserRoles, ADMIN_ROLES } from '@/lib/auth';
import type { EvaluationStatus } from '@/types';

interface EvalRowProps {
  evaluation: {
    id: string;
    name: string;
    type: string;
    status: EvaluationStatus;
    start_date?: string;
    end_date?: string;
    created_by?: string;
    created_by_name?: string;
    allowed_transitions?: EvaluationStatus[];
    member_type_name?: string;
    member_type?: string;
  };
  onAction: (action: string, id: string, payload?: unknown) => void;
}

export function EvalRow({ evaluation, onAction }: EvalRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    action: string;
  } | null>(null);
  const t = useTranslations('evaluation');
  const ct = useTranslations('common');
  const locale = useLocale();

  const canEditEvaluation = evaluation.status === 'borrador';
  const userRoles = getUserRoles();
  const isAdmin = ADMIN_ROLES.some((r) => userRoles.includes(r));
  const canDeleteEvaluation = isAdmin || evaluation.status === 'borrador';
  const createdByName = evaluation.created_by_name?.trim() || '-';

  const handleConfirmAction = (action: string, title: string, description: string) => {
    // Validate deletion is allowed before showing confirm dialog
    if (action === 'delete' && !canDeleteEvaluation) {
      toast.warning(t('row.delete-not-allowed'));
      return;
    }
    // Admin deleting a non-draft evaluation: use a stronger warning
    let finalDescription = description;
    if (action === 'delete' && isAdmin && evaluation.status !== 'borrador') {
      finalDescription = t('row.delete-admin-warning', { status: evaluation.status });
    }
    setConfirmConfig({ title, description: finalDescription, action });
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (confirmConfig) {
      onAction(confirmConfig.action, evaluation.id);
    }
    setConfirmOpen(false);
    setConfirmConfig(null);
  };

  return (
    <>
      <TableRow className="hover:bg-zinc-50 transition-colors border-b border-zinc-100">
        <TableCell className="font-medium">
	          <Link
	            href={`/evaluaciones/${evaluation.id}`}
	            className="text-[#040927] underline underline-offset-2 transition-colors hover:text-[#040927]/80"
	          >
            {evaluation.name}
          </Link>
        </TableCell>
        <TableCell>
          <TypeBadge type={evaluation.type} />
        </TableCell>
        <TableCell>
          <StatusBadge status={evaluation.status} />
        </TableCell>
        <TableCell>{formatDate(evaluation.start_date, locale)}</TableCell>
        <TableCell>{formatDate(evaluation.end_date, locale)}</TableCell>
        <TableCell>{createdByName}</TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Link
              href={`/evaluaciones/${evaluation.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              aria-label={t('row.view-aria', { name: evaluation.name })}
              title={t('row.view')}
            >
              <Eye className="h-4 w-4" />
            </Link>

            {canEditEvaluation && (
              <Link
                href={`/evaluaciones/${evaluation.id}/editar`}
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                aria-label={t('row.edit-aria', { name: evaluation.name })}
                title={t('row.edit')}
              >
                <Edit className="h-4 w-4" />
              </Link>
            )}

            {canDeleteEvaluation && (
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label={t('row.delete-aria', { name: evaluation.name })}
                title={t('row.delete')}
                onClick={() =>
                  handleConfirmAction(
                    'delete',
                    t('row.delete-title'),
                    t('row.delete-description'),
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </TableCell>
      </TableRow>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmConfig?.title ?? t('row.confirm-title')}
        description={confirmConfig?.description ?? ''}
        onConfirm={handleConfirm}
        confirmText={confirmConfig?.action === 'delete' ? ct('delete') : ct('confirm')}
        variant={confirmConfig?.action === 'delete' ? 'destructive' : 'default'}
      />
    </>
  );
}
