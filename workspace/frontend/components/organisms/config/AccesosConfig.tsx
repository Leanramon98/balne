'use client';

import { useAuditLogs } from '@/sdk/hooks/useAuditLogs';
import { AuditLogsTable } from '@/components/organisms/AuditLogsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccesosTab() {
  const { logs, isLoading } = useAuditLogs();

  return (
    <Card>
      <CardHeader><CardTitle>Historial de Accesos</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="p-6">
          <AuditLogsTable logs={(logs ?? []) as any} isLoading={isLoading} />
        </div>
      </CardContent>
    </Card>
  );
}
