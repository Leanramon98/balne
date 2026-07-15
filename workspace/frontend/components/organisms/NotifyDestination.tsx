'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { getUserRoles } from '@/lib/auth';

interface NotifyDestinationProps {
  evaluationId: string;
}

export function NotifyDestination({ evaluationId }: NotifyDestinationProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const roles = getUserRoles();
    setIsAdmin(roles.includes('admin'));
  }, []);

  if (!isAdmin) return null;

  const handleNotify = async () => {
    setIsSending(true);
    try {
      // API call mocked for now
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success('Notificación enviada al equipo del destino');
      setShowConfirm(false);
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar la notificación');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
      >
        <Bell className="mr-2 h-4 w-4" />
        Notificar Destino
      </Button>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Notificar al Destino"
        description="Se enviará una notificación por email al equipo del destino indicando que hay nuevos mensajes o actualizaciones en la evaluación."
        confirmText={isSending ? 'Enviando...' : 'Enviar Notificación'}
        variant="default"
        onConfirm={handleNotify}
      />
    </>
  );
}
