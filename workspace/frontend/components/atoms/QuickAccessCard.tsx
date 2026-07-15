'use client';

import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuickAccessCardProps {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function QuickAccessCard({ href, label, icon: Icon, description, className }: QuickAccessCardProps) {
  return (
    <Link href={href} className={cn('group block', className)}>
      <Card className="border-zinc-200 transition-colors hover:border-blue-200 hover:bg-blue-50/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 group-hover:text-blue-700">
              {label}
            </p>
            {description && (
              <p className="text-xs text-zinc-500 truncate">{description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
