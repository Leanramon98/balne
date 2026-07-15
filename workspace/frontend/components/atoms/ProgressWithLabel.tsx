'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressWithLabelProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}

export function ProgressWithLabel({
  value,
  max = 100,
  showLabel = true,
  className,
}: ProgressWithLabelProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const isComplete = percentage >= 100;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Progress
        value={percentage}
        className={cn('flex-1', isComplete && '[&>div]:bg-green-500')}
      />
      {showLabel && (
        <span className="text-sm text-gray-500 whitespace-nowrap min-w-[6rem] text-right">
          {value}/{max} completados
          <span className="ml-1 font-medium text-gray-700">{percentage}%</span>
        </span>
      )}
    </div>
  );
}
