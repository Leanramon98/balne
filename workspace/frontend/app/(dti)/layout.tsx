'use client';

import React from 'react';
import { RoleGuard } from '@/sdk/auth/guards_generated';
import { DestinoProvider } from '@/context/destino-context';
import { DtiShell } from '@/components/templates/DtiShell';
import { PageTransition } from '@/components/atoms/PageTransition';
import { Toaster } from 'sonner';

const DTI_ROLES = ['admin', 'admin_destino', 'gestor_destino', 'consultor', 'auditor', 'gestor_regional', 'gestor_nacional'];

export default function DtiLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={DTI_ROLES}>
      <DestinoProvider>
        <Toaster richColors position="top-right" />
        <DtiShell>
          <PageTransition>{children}</PageTransition>
        </DtiShell>
      </DestinoProvider>
    </RoleGuard>
  );
}
