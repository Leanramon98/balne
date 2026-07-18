'use client';

import { type ReactNode } from 'react';
import { moduleRegistry } from '@/sdk/platform';

// Register reference module navigation contributions on import
moduleRegistry.register({
  moduleId: 'reference',
  navItems: [
    {
      id: 'reference-notes',
      label: 'Notes',
      href: '/reference',
      icon: 'fileText',
      section: 'Modules',
      order: 1,
    },
  ],
});

export default function ReferenceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
