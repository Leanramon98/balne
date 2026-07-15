'use client';

import React, { useState, useRef, useCallback } from 'react';
import useSWR from 'swr';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { EvidenceIcon } from '@/components/atoms/EvidenceIcon';
import {
  Loader2, Upload, Download, Trash2, Link as LinkIcon,
  Video, Newspaper, FileText,
} from 'lucide-react';
import {
  uploadFile, deleteEvidence, addEvidence, getEvidence,
} from '@/sdk/api/evaluations-api';
import { getEvidenceTypeLabel } from '@/lib/display-names';
import type { ActionEvidence, EvidenceType } from '@/types';

interface EvidenceModalProps {
  actionId: string;
  actionName: string;
  evaluationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEvidenceChange: () => void;
}

export function EvidenceModal({
  actionId,
  actionName,
  evaluationId,
  open,
  onOpenChange,
  onEvidenceChange,
}: EvidenceModalProps) {
  const { data: evidences, isLoading, mutate } = useSWR(
    open ? ['action-evidence', actionId] : null,
    () => getEvidence(actionId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  const [uploading, setUploading] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    if (uploading) return;
    setUploading(true);
    try {
      await uploadFile(actionId, evaluationId, file);
      await mutate();
      onEvidenceChange();
    } catch (err: any) {
      alert(err.message || 'Error al subir archivo');
    } finally {
      setUploading(false);
    }
  }, [actionId, evaluationId, uploading, mutate, onEvidenceChange]);

  const handleDownload = useCallback((evId: string) => {
    const a = document.createElement('a');
    a.href = `/api/files/${evId}`;
    a.download = '';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleDelete = useCallback(async (evId: string) => {
    if (!confirm('¿Eliminar esta evidencia?')) return;
    try {
      await deleteEvidence(actionId, evId);
      await mutate();
      onEvidenceChange();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar evidencia');
    }
  }, [actionId, mutate, onEvidenceChange]);

  const handleAddUrl = useCallback(async (type: string) => {
    if (!urlValue.trim()) return;
    setAddingUrl(true);
    try {
      await addEvidence(actionId, evaluationId, type as EvidenceType, urlValue.trim());
      setUrlValue('');
      await mutate();
      onEvidenceChange();
    } catch (err: any) {
      alert(err.message || 'Error al agregar URL');
    } finally {
      setAddingUrl(false);
    }
  }, [actionId, evaluationId, urlValue, mutate, onEvidenceChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            Evidencias — {actionName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing evidence list */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando evidencias...
            </div>
          ) : evidences && evidences.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {evidences.map((ev: ActionEvidence) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between rounded border p-2 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <EvidenceIcon type={ev.type} />
                    <span className="truncate">
                      {ev.type === 'url' ? (
                        <a href={ev.url || '#'} target="_blank" rel="noopener noreferrer"
                           className="text-blue-600 hover:underline truncate block max-w-[250px]">
                          {ev.url}
                        </a>
                      ) : (
                        <span className="text-gray-700">
                          {getEvidenceTypeLabel(ev.type)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {ev.file_path && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDownload(ev.id)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(ev.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay evidencias todavía.
            </p>
          )}

          <Separator />

          {/* File upload */}
          <div
            className={`rounded-lg border-2 border-dashed p-4 text-center transition-colours ${
              dragOver ? 'border-primary bg-primary/5' : 'border-gray-200'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileUpload(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs text-gray-500">Subiendo archivo...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-5 w-5 text-gray-400" />
                <p className="text-xs text-gray-500">
                  Arrastre un archivo o haga clic para seleccionar
                </p>
              </div>
            )}
          </div>

          {/* URL / Enlace input */}
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">
              O agregar un enlace
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="https://..."
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                className="text-sm flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!urlValue.trim() || addingUrl}
                onClick={() => handleAddUrl('url')}
                className="flex-1"
              >
                <LinkIcon className="h-3 w-3 mr-1" />
                URL
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!urlValue.trim() || addingUrl}
                onClick={() => handleAddUrl('audiovisual')}
                className="flex-1"
              >
                <Video className="h-3 w-3 mr-1" />
                Audiovisual
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!urlValue.trim() || addingUrl}
                onClick={() => handleAddUrl('press')}
                className="flex-1"
              >
                <Newspaper className="h-3 w-3 mr-1" />
                Prensa
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
