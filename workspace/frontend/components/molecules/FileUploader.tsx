'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';

interface FileUploaderProps {
  evaluationId?: string;
  onUpload: (file: File) => Promise<unknown>;
  /** Optional additional CSS classes for the drop zone */
  className?: string;
}

export function FileUploader({ evaluationId, onUpload, className }: FileUploaderProps) {
  const t = useTranslations('file-uploader');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (uploading) return;
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err: any) {
      alert(err.message || t('error-upload'));
    } finally {
      setUploading(false);
    }
  }, [onUpload, uploading]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (!evaluationId) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">
          {t('no-evaluation-hint')}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border-2 border-dashed p-6 text-center transition-colours ${
        dragOver ? 'border-primary bg-primary/5' : 'border-gray-200'
      } ${className ?? ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
        disabled={uploading}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">{t('uploading')}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium">{t('drop-hint')}</p>
            <p className="text-xs text-gray-500">{t('drop-types')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
