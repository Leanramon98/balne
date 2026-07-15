'use client';

import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/atoms/AnimatedCounter';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  value: string | number;
  label: string;
  icon: LucideIcon;
  isLoading?: boolean;
  className?: string;
}

function formatKpiValue(value: string | number) {
  if (typeof value === 'number') {
    return <AnimatedCounter value={value} />;
  }
  if (typeof value === 'string' && value.endsWith('%')) {
    const numericValue = parseFloat(value.replace('%', ''));
    if (!isNaN(numericValue)) {
      return <AnimatedCounter value={numericValue} suffix="%" />;
    }
  }
  return value;
}

export function KpiCard({ value, label, icon: Icon, isLoading, className }: KpiCardProps) {
  return (
    <Card className={cn('border-zinc-200', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-zinc-900">{formatKpiValue(value)}</p>
            )}
            <p className="text-sm text-zinc-500">{label}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
