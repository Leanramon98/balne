'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download } from 'lucide-react';
import { EvidenceIcon } from '@/components/atoms/EvidenceIcon';
import { FileUploader } from '@/components/molecules/FileUploader';
import { useEvidence } from '@/sdk/hooks/useActions';
import { getEvidenceTypeLabel } from '@/lib/display-names';
import { formatDate } from '@/lib/date-utils';

interface EvidenceSectionProps {
  actionId: string;
  evaluationId: string;
}

export function EvidenceSection({ actionId, evaluationId }: EvidenceSectionProps) {
  const t = useTranslations('page.accion');
  const locale = useLocale();
  const { evidence, isLoading, error, addFile } = useEvidence(actionId, evaluationId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('evidence.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4 animate-pulse" />
            {t('evidence.loading')}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : evidence.length === 0 ? (
          <p className="text-sm text-gray-500">{t('evidence.empty')}</p>
        ) : (
          <div className="space-y-2">
            {evidence.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <EvidenceIcon type={ev.type} />
                  <div>
                    <p className="text-sm font-medium">
                      {getEvidenceTypeLabel(ev.type)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(ev.created_at, locale, {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getEvidenceTypeLabel(ev.type)}
                  </Badge>
                  {ev.file_path && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`/api/files/${ev.id}`} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <FileUploader
          evaluationId={evaluationId}
          onUpload={addFile}
        />
      </CardContent>
    </Card>
  );
}
