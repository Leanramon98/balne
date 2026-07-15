'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const GRADIENT_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '25', label: '25%' },
  { value: '50', label: '50%' },
  { value: '75', label: '75%' },
  { value: '100', label: '100%' },
];

interface GradientSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function GradientSelect({ value, onChange, disabled }: GradientSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-28">
        <SelectValue placeholder="Seleccionar" />
      </SelectTrigger>
      <SelectContent>
        {GRADIENT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
