'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number';
}

interface SimpleCrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Record<string, any> | null;
  fields?: FieldDef[];
  onSave: (data: Record<string, any>) => Promise<void>;
  title?: string;
}

export function SimpleCrudDialog({
  open,
  onOpenChange,
  item,
  fields,
  onSave,
  title,
}: SimpleCrudDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      const initial: Record<string, string> = {};
      (fields || [{ key: 'name', label: 'Nombre' }]).forEach((f) => {
        initial[f.key] = item[f.key]?.toString() || '';
      });
      setValues(initial);
    } else {
      setValues({});
    }
  }, [item, fields, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, any> = {};
      (fields || [{ key: 'name', label: 'Nombre' }]).forEach((f) => {
        data[f.key] = f.type === 'number' ? Number(values[f.key]) : values[f.key];
      });
      await onSave(data);
      onOpenChange(false);
    } catch {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const fieldList = fields || [{ key: 'name', label: 'Nombre' }];
  const dialogTitle = title || (item ? 'Editar' : 'Nuevo');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {fieldList.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label>{f.label}</Label>
              <Input
                value={values[f.key] || ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.label}
              />
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
