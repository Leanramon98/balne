'use client';

import { ReactNode } from 'react';
import { NeutralShell } from '@/components/templates/NeutralShell';

// Import dynamic module layouts to trigger their self-registration in the registry
import './user/layout';
import './role/layout';

interface ModulesLayoutProps {
  children: ReactNode;
}

export default function ModulesLayout({ children }: ModulesLayoutProps) {
  return <NeutralShell>{children}</NeutralShell>;
}
