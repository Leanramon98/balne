'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BOOLEAN_OPTIONS = [
  { value: 'Sí', label: 'Sí' },
  { value: 'No', label: 'No' },
];

interface BooleanSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function BooleanSelect({ value, onChange, disabled }: BooleanSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-28">
        <SelectValue placeholder="Seleccionar" />
      </SelectTrigger>
      <SelectContent>
        {BOOLEAN_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
