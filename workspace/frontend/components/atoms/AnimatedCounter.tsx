'use client';

import { useState, useEffect } from 'react';
import { useMotionValue, useTransform, animate, motion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
}

export function AnimatedCounter({ value, duration = 1.5, suffix }: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    const roundedValue = Math.round(latest);
    if (roundedValue >= 1000) {
      return roundedValue.toLocaleString('es-ES');
    }
    return String(roundedValue);
  });

  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return controls.stop;
  }, [value, duration, count]);

  useEffect(() => {
    return rounded.on('change', (latest) => setDisplay(latest));
  }, [rounded]);

  return (
    <motion.span>
      {display}
      {suffix}
    </motion.span>
  );
}
