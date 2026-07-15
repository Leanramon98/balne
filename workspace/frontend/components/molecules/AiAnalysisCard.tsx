'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Brain } from 'lucide-react';

interface AiAnalysisCardProps {
  analysisText?: string | null;
  isDestination: boolean;
  analyzing: boolean;
  onAnalyze: () => void;
}

/**
 * Card that displays AI analysis results for an indicator.
 * Shows the analysis text when available, a placeholder otherwise,
 * and includes a button for destination users to trigger analysis.
 */
export function AiAnalysisCard({
  analysisText,
  isDestination,
  analyzing,
  onAnalyze,
}: AiAnalysisCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-indigo-500" />
          Análisis IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {analysisText ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4 text-sm text-indigo-800">
            {analysisText}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Sin análisis disponible. Haz clic en &quot;Analizar con IA&quot; para generar un
            análisis automático.
          </p>
        )}

        {isDestination && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAnalyze}
            disabled={analyzing}
          >
            <Brain className="mr-2 h-4 w-4" />
            {analyzing ? 'Analizando...' : 'Analizar con IA'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
