'use client';

import { ReactNode } from 'react';

interface ContentTransitionProps {
  children: ReactNode;
  /**
   * Any value that changes when the content/panel changes.
   * When this value changes the wrapper remounts and the CSS enter
   * animation (cross-fade + lift) plays again.
   */
  trigger: string | number;
}

/**
 * Wraps dynamic content (tabs, wizard steps, conditional panels, etc.)
 * so it plays the same cross-fade animation used for page transitions.
 *
 * Usage inside a Tabs component:
 *   <TabsContent value="usuarios">
 *     <ContentTransition trigger="usuarios">
 *       <UsersTab />
 *     </ContentTransition>
 *   </TabsContent>
 */
export function ContentTransition({ children, trigger }: ContentTransitionProps) {
  return (
    <div key={trigger} className="animate-content-enter">
      {children}
    </div>
  );
}
