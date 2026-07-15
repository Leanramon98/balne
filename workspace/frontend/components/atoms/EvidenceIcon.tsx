'use client';

import React from 'react';
import {
  FileText,
  Link as LinkIcon,
  Video,
  Newspaper,
} from 'lucide-react';
import type { EvidenceType } from '@/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  document: <FileText className="h-4 w-4 text-blue-500" />,
  url: <LinkIcon className="h-4 w-4 text-green-500" />,
  audiovisual: <Video className="h-4 w-4 text-purple-500" />,
  press: <Newspaper className="h-4 w-4 text-orange-500" />,
};

interface EvidenceIconProps {
  type: EvidenceType | string;
  className?: string;
}

export function EvidenceIcon({ type, className }: EvidenceIconProps) {
  const icon = ICON_MAP[type];
  if (!icon) return <FileText className={className ?? 'h-4 w-4 text-gray-400'} />;
  if (className) {
    // Re-create with custom className — the ICON_MAP already has inline classes
    // so we return the icon as-is for the default case
    return <>{icon}</>;
  }
  return <>{icon}</>;
}
