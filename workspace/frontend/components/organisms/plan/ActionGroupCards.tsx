'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getActionStatusLabel } from '@/lib/display-names';
import type { Action } from '@/types';

interface ActionGroupCardsProps {
  groupedActions: {
    active: Action[];
    achieved: Action[];
    discarded: Action[];
  };
}

export function ActionGroupCards({ groupedActions }: ActionGroupCardsProps) {
  const t = useTranslations('page.plan');
  return (
    <>
      {/* Plan vigente — brechas a cerrar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant="default" className="bg-blue-500">{t('group.active-title')}</Badge>
            <span className="text-sm font-normal text-gray-500">{t('group.active-subtitle', { count: groupedActions.active.length })}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {groupedActions.active.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">{t('group.no-active')}</div>
          ) : (
            <div className="divide-y">
              {groupedActions.active.map((action: Action) => (
                <Link key={action.id} href={`/acciones/${action.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{action.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {getActionStatusLabel(action.status)}
                      </Badge>
                      {action.responsible_person && (
                        <span className="text-xs text-gray-500">{action.responsible_person}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(action.axes || []).map((ax: string) => (
                      <Badge key={ax} variant="outline" className="text-xs uppercase">{ax}</Badge>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logros alcanzados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant="default" className="bg-green-600">{t('group.achieved-title')}</Badge>
            <span className="text-sm font-normal text-gray-500">({groupedActions.achieved.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {groupedActions.achieved.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">{t('group.no-achieved')}</div>
          ) : (
            <div className="divide-y">
              {groupedActions.achieved.map((action: Action) => (
                <Link key={action.id} href={`/acciones/${action.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{action.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{t('group.achieved-badge')}</Badge>
                      {action.responsible_person && (
                        <span className="text-xs text-gray-500">{action.responsible_person}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(action.axes || []).map((ax: string) => (
                      <Badge key={ax} variant="outline" className="text-xs uppercase">{ax}</Badge>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Descartadas */}
      {groupedActions.discarded.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="default" className="bg-gray-500">{t('group.discarded-title')}</Badge>
              <span className="text-sm font-normal text-gray-500">({groupedActions.discarded.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {groupedActions.discarded.map((action: Action) => (
                <Link key={action.id} href={`/acciones/${action.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{action.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{t('group.discarded-badge')}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(action.axes || []).map((ax: string) => (
                      <Badge key={ax} variant="outline" className="text-xs uppercase">{ax}</Badge>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
