'use client';

import { ReactNode } from 'react';

/**
 * Wraps page children with a fade-in + lift animation on mount.
 *
 * Unlike the previous `key={pathname}` approach, this does NOT force a full
 * remount of the component tree on every navigation — preserving form state,
 * scroll position, and SWR caches across client-side transitions.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="animate-content-enter">
      {children}
    </div>
  );
}
