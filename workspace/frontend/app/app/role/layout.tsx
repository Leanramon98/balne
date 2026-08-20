'use client';

import { ReactNode } from 'react';
import { moduleRegistry } from '@/sdk/platform';

// Register role module contributions on import
moduleRegistry.register({
  moduleId: 'role',
  navItems: [
    {
      id: 'admin-roles',
      label: 'Roles',
      href: '/app/role',
      icon: 'users',
      section: 'Administración',
      order: 2,
    },
  ],
});

export default function RoleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
