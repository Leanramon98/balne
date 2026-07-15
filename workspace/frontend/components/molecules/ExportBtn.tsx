'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clipboard, FileSpreadsheet, Download, ChevronDown } from 'lucide-react';
import { exportToClipboard, exportToExcel, exportToPdf } from '@/lib/export-utils';
import { toast } from 'sonner';

interface ExportBtnProps {
  data: Record<string, any>[];
  columns: { key: string; label: string }[];
  filename: string;
  tableId?: string;
}

export function ExportBtn({ data, columns, filename, tableId }: ExportBtnProps) {
  const [loading, setLoading] = useState<'clipboard' | 'excel' | 'pdf' | null>(null);
  const ct = useTranslations('common');

  const handleClipboard = async () => {
    setLoading('clipboard');
    try {
      await exportToClipboard(data, columns.map((c) => c.key));
      toast.success(ct('copied'));
    } catch (err: any) {
      toast.error(err.message || ct('error'));
    } finally {
      setLoading(null);
    }
  };

  const handleExcel = async () => {
    setLoading('excel');
    try {
      const filteredData = data.map((row) => {
        const obj: Record<string, any> = {};
        columns.forEach((col) => {
          obj[col.label] = row[col.key] ?? '';
        });
        return obj;
      });
      await exportToExcel(filteredData, filename);
      toast.success(ct('downloaded'));
    } catch (err: any) {
      toast.error(err.message || ct('error'));
    } finally {
      setLoading(null);
    }
  };

  const handlePdf = async () => {
    if (!tableId) {
      toast.error(ct('error'));
      return;
    }
    setLoading('pdf');
    try {
      await exportToPdf(tableId, filename);
      toast.success(ct('downloaded'));
    } catch (err: any) {
      toast.error(err.message || ct('error'));
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  const getLoadingLabel = () => {
    if (loading === 'clipboard') return ct('copy');
    if (loading === 'excel') return ct('excel');
    if (loading === 'pdf') return ct('pdf');
    return ct('changing');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          {isLoading ? getLoadingLabel() : ct('export')}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleClipboard} disabled={isLoading}>
          <Clipboard className="mr-2 h-4 w-4" /> {ct('copy')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExcel} disabled={isLoading}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> {ct('excel')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePdf} disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" /> {ct('pdf')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
