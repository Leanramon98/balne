'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number;
  delay?: number;
  className?: string;
}

export function AnimatedProgress({ value, delay = 0, className }: AnimatedProgressProps) {
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}>
      <motion.div
        className="h-full w-full flex-1 rounded-full bg-primary"
        initial={{ width: '0%' }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay, ease: 'easeOut' }}
      />
    </div>
  );
}
