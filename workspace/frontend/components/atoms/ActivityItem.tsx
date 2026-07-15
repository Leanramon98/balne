'use client';

import { Clock, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItemProps {
  timestamp: string;
  action: string;
  user?: string;
  className?: string;
}

export function ActivityItem({ timestamp, action, user, className }: ActivityItemProps) {
  const date = new Date(timestamp).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('flex gap-3', className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-900">{action}</p>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {date}
          </span>
          {user && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {user}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
