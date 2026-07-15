import React from 'react';
import { cn } from '@/lib/utils';

interface NavSectionLabelProps {
  children: React.ReactNode;
  isFirst?: boolean;
}

export function NavSectionLabel({ children, isFirst = false }: NavSectionLabelProps) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.07em] px-3 mb-1',
        isFirst ? 'mt-2' : 'mt-4'
      )}
    >
      {children}
    </p>
  );
}
