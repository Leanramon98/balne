import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageAction {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  action?: PageAction;
  children?: React.ReactNode;
}

export function PageHeader({ title, action, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex items-center gap-2">
        {action && (action.href ? (
          <Link href={action.href}>
            <Button size="sm">
              {action.icon}
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button size="sm" onClick={action.onClick}>
            {action.icon}
            {action.label}
          </Button>
        ))}
        {children}
      </div>
    </div>
  );
}
