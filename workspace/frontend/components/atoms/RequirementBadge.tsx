'use client';

import { useLocale } from 'next-intl';
import useSWR from 'swr';
import { getRequirements } from '@/sdk/api/evaluations-api';
import { getRequirementName } from '@/lib/requirement-translations';
import { Badge } from '@/components/ui/badge';

interface RequirementBadgeProps {
  requirement_id: string;
  className?: string;
}

/**
 * Client component that resolves a requirement_id to its display name
 * via a pre-fetched requirements list (SWR deduplicated across instances).
 *
 * Fallback chain: requirement name → '-'
 */
export function RequirementBadge({ requirement_id, className }: RequirementBadgeProps) {
  const locale = useLocale();
  const { data: requirements, error } = useSWR('requirements', () => getRequirements());

  if (!requirement_id) {
    return <Badge variant="outline" className={className}>-</Badge>;
  }

  if (error || !requirements) {
    return <Badge variant="outline" className={className}>-</Badge>;
  }

  const req = requirements.find((r) => r.id === requirement_id);
  const label = getRequirementName(req?.code, locale, req?.name ?? '-');

  return <Badge variant="outline" className={className}>{label}</Badge>;
}
