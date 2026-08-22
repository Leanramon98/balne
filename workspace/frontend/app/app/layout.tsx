'use client';

import { ReactNode } from 'react';
import { NeutralShell } from '@/components/templates/NeutralShell';
import { AuthProvider } from '@/sdk/auth/AuthContext';
import { moduleRegistry } from '@/sdk/platform';

moduleRegistry.register({
  moduleId: 'balne-operations',
  navItems: [
    {
      id: 'operations-overview',
      label: 'Panel',
      href: '/app',
      icon: 'dashboard',
      section: 'Operación',
      order: 1,
    },
    {
      id: 'venue-plan',
      label: 'Plano Activo',
      href: '/app/planificacion',
      icon: 'map',
      section: 'Operación',
      order: 2,
    },
    {
      id: 'reservations',
      label: 'Reservas',
      href: '/app/reservas',
      icon: 'calendar',
      section: 'Operación',
      order: 3,
    },
    {
      id: 'plan-editor',
      label: 'Editor de Planos',
      href: '/app/planos/editor',
      icon: 'edit',
      section: 'Configuración de Planos',
      order: 4,
    },
    {
      id: 'plans-gallery',
      label: 'Mis Planos',
      href: '/app/planos',
      icon: 'layers',
      section: 'Configuración de Planos',
      order: 5,
    },
  ],
});

// Import dynamic module layouts to trigger their self-registration in the registry
import './user/layout';
import './role/layout';

interface ModulesLayoutProps {
  children: ReactNode;
}

export default function ModulesLayout({ children }: ModulesLayoutProps) {
  return (
    <AuthProvider>
      <NeutralShell>{children}</NeutralShell>
    </AuthProvider>
  );
}
