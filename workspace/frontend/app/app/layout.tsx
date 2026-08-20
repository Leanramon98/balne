'use client';

import { ReactNode } from 'react';
import { NeutralShell } from '@/components/templates/NeutralShell';
import { AuthProvider } from '@/sdk/auth/AuthContext';

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
