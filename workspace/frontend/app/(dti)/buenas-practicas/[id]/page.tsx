'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import useSWR from 'swr';
import { getGoodPractice } from '@/sdk/api/evaluations-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Award, MapPin, Globe, ExternalLink, ArrowLeft, FileText,
  Image as ImageIcon, Link as LinkIcon, Video, Newspaper,
  Trophy,
} from 'lucide-react';
import { getAxisLabel } from '@/lib/display-names';
import type { GoodPracticePublic } from '@/types';

export default function BuenaPracticaDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const locale = useLocale();
  const t = useTranslations('page.buenas-practicas');
  const bt = useTranslations('breadcrumb');
  const ct = useTranslations('common');

  const { data: practice, isLoading, error } = useSWR<GoodPracticePublic>(
    id ? `good-practice-${id}-${locale}` : null,
    () => getGoodPractice(id, locale),
  );

  if (isLoading) {
    return (
      <div className="px-6 py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link href="/buenas-practicas">
                <BreadcrumbPage className="text-zinc-500 text-sm hover:text-zinc-700">{t('title')}</BreadcrumbPage>
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-medium text-zinc-900">{t('detail')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">{t('not-found')}</h2>
            <p className="text-gray-500 mb-4">
              {error.message === `GET /public/good-practices/${id} failed: 404`
                ? t('not-found-404')
                : t('load-error', { message: error.message })}
            </p>
            <Link href="/buenas-practicas">
              <Button>{t('view-all')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!practice) return null;

  // Parse axes and scopes from the response
  const axes: string[] = (practice as any).axes || practice.axis_names || [];
  const scopes: string[] = (practice as any).scopes || practice.scope_names || [];
  const odsList = practice.ods || [];

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/buenas-practicas">
              <BreadcrumbPage className="text-zinc-500 text-sm hover:text-zinc-700">{t('title')}</BreadcrumbPage>
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium text-zinc-900">{t('detail')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card>
        <CardContent className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <Award className="h-10 w-10 text-yellow-500 shrink-0 mt-1" />
            <div>
              <h1 className="text-3xl font-bold mb-2">{practice.action_name}</h1>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{practice.destination_name}{practice.country ? `, ${practice.country}` : ''}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {axes.map((axis: string) => (
              <Badge key={axis} variant="default">
                {getAxisLabel(axis, locale) || axis}
              </Badge>
            ))}
            {scopes.map((scope: string) => (
              <Badge key={scope} variant="secondary">{scope}</Badge>
            ))}
            {practice.typology && (
              <Badge variant="outline">{practice.typology}</Badge>
            )}
            {practice.population_range && (
              <Badge variant="outline">{practice.population_range}</Badge>
            )}
          </div>

          {/* Summary */}
          {practice.action_summary && (
            <p className="text-lg text-gray-700 mb-4">{practice.action_summary}</p>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {practice.action_description && (
        <Card>
          <CardHeader><CardTitle>{t('description')}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-line">{practice.action_description}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('destination-card')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{practice.destination_name}</span>
              </div>
              {practice.country && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{practice.country}</span>
                </div>
              )}
              {practice.typology && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{t('typology-label', { typology: practice.typology })}</Badge>
                </div>
              )}
              {practice.population_range && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{t('population-label', { range: practice.population_range })}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('axes-scopes')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('axes')}</p>
                <div className="flex flex-wrap gap-1">
                  {axes.length > 0 ? axes.map((axis: string) => (
                    <Badge key={axis} variant="default" className="text-xs">
                {getAxisLabel(axis, locale) || axis}
                    </Badge>
                  )) : <span className="text-sm text-gray-400">—</span>}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('scopes')}</p>
                <div className="flex flex-wrap gap-1">
                  {scopes.length > 0 ? scopes.map((scope: string) => (
                    <Badge key={scope} variant="secondary" className="text-xs">{scope}</Badge>
                  )) : <span className="text-sm text-gray-400">—</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ODS */}
      {odsList.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t('ods-section-title')}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {odsList.map((ods: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Trophy className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-sm font-medium">{t('ods-item', { id: ods.ods_id })}</span>
                    {ods.contribution && (
                      <p className="text-xs text-gray-500">{ods.contribution}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo */}
      {practice.photo_url && (
        <Card>
          <CardHeader><CardTitle>{t('photo')}</CardTitle></CardHeader>
          <CardContent>
            <div className="relative w-full max-h-96 overflow-hidden rounded-lg">
              <img
                src={practice.photo_url}
                alt={practice.action_name}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidencias */}
      {(practice.evidence_docs?.length || practice.evidence_urls?.length ||
        practice.audiovisual_links?.length || practice.press_notes?.length) ? (
        <Card>
          <CardHeader><CardTitle>{t('evidence')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {practice.evidence_docs && practice.evidence_docs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">{t('documents')}</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {practice.evidence_docs.map((url, i) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" /> {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {practice.evidence_urls && practice.evidence_urls.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">{t('links')}</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {practice.evidence_urls.map((url, i) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" /> {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {practice.audiovisual_links && practice.audiovisual_links.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-sm">{t('audiovisual')}</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {practice.audiovisual_links.map((url, i) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" /> {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {practice.press_notes && practice.press_notes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-sm">{t('press-notes')}</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {practice.press_notes.map((url, i) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" /> {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Premios */}
      {practice.awards && (
        <Card>
          <CardHeader><CardTitle>{t('awards')}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-line">{practice.awards}</p>
          </CardContent>
        </Card>
      )}

      {/* Website */}
      {practice.website_url && (
        <div className="text-center">
          <a href={practice.website_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" /> {t('website')}
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
