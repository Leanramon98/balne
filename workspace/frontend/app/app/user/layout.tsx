'use client';

import { ReactNode } from 'react';
import { moduleRegistry } from '@/sdk/platform';

// Register user module contributions on import
moduleRegistry.register({
  moduleId: 'user',
  navItems: [
    {
      id: 'admin-users',
      label: 'Usuarios',
      href: '/app/user',
      icon: 'users',
      section: 'Administración',
      order: 1,
    },
  ],
});

export default function UserLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
