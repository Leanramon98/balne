'use client';

import { ReactNode } from 'react';
import { moduleRegistry } from '@/sdk/platform';

// Register audit log module contributions on import
moduleRegistry.register({
  moduleId: 'auditlog',
  navItems: [
    {
      id: 'admin-auditlog',
      label: 'Auditoría',
      href: '/app/auditlog',
      icon: 'clipboard',
      section: 'Administración',
      order: 3,
    },
  ],
});

export default function AuditlogLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
