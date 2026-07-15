'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useContentTranslations } from '@/sdk/hooks/useContentTranslations';
import { reviewContentTranslation } from '@/sdk/api/evaluations-api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Edit, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ActionTranslation } from '@/types';

export default function ContentTranslationsTab() {
  const t = useTranslations('config.content-translations');
  const ct = useTranslations('common');

  const [localeFilter, setLocaleFilter] = useState('pt');
  const [reviewedFilter, setReviewedFilter] = useState<string>('false');
  const [editingTranslation, setEditingTranslation] = useState<ActionTranslation | null>(null);
  const [editForm, setEditForm] = useState({ name: '', summary: '', description: '' });
  const [saving, setSaving] = useState(false);

  const { translations, isLoading, error, mutate } = useContentTranslations({
    locale: localeFilter || undefined,
    reviewed: reviewedFilter === 'all' ? undefined : reviewedFilter === 'true',
  });

  const handleEdit = (tr: ActionTranslation) => {
    setEditingTranslation(tr);
    setEditForm({
      name: tr.name || '',
      summary: tr.summary || '',
      description: tr.description || '',
    });
  };

  const handleSaveReview = async () => {
    if (!editingTranslation) return;
    setSaving(true);
    try {
      await reviewContentTranslation(editingTranslation.id, {
        name: editForm.name,
        summary: editForm.summary || undefined,
        description: editForm.description || undefined,
      });
      toast.success(t('reviewed-success'));
      setEditingTranslation(null);
      mutate();
    } catch (err: any) {
      toast.error(err.message || ct('error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">{t('description')}</p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="space-y-1">
          <Label className="text-xs">{t('filter.locale')}</Label>
          <Select value={localeFilter} onValueChange={setLocaleFilter}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="all">{t('filter.all')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('filter.reviewed')}</Label>
          <Select value={reviewedFilter} onValueChange={setReviewedFilter}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">{t('status.not-reviewed')}</SelectItem>
              <SelectItem value="true">{t('status.reviewed')}</SelectItem>
              <SelectItem value="all">{t('filter.all')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="border border-zinc-200 rounded-[12px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase">{t('table.action')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase">{t('table.locale')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase">{t('table.status')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase">{t('table.translated-at')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase w-24 text-center">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : error ? (
        <div className="border border-zinc-200 rounded-[12px] p-6 text-red-500">{ct('error')}: {error.message}</div>
      ) : translations && translations.length > 0 ? (
        <div className="border border-zinc-200 rounded-[12px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase py-3 px-4 border-b border-zinc-200">{t('table.action')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase py-3 px-4 border-b border-zinc-200">{t('table.locale')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase py-3 px-4 border-b border-zinc-200">{t('table.status')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase py-3 px-4 border-b border-zinc-200">{t('table.translated-at')}</TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase py-3 px-4 border-b border-zinc-200 w-24 text-center">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {translations.map((tr) => (
                <TableRow key={tr.id}>
                  <TableCell className="font-medium">{tr.action_name ?? tr.name}</TableCell>
                  <TableCell><Badge variant="outline">{tr.locale.toUpperCase()}</Badge></TableCell>
                  <TableCell>
                    <Badge className={tr.translation_reviewed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                      {tr.translation_reviewed ? t('status.reviewed') : t('status.not-reviewed')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {new Date(tr.translated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(tr)}
                        title={t('action.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-[12px] p-6 text-center text-zinc-500">
          <Search className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
          <p>{t('empty')}</p>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingTranslation} onOpenChange={(open) => { if (!open) setEditingTranslation(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('modal.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">{t('modal.source-es')}</Label>
                <div className="p-2 border border-zinc-200 rounded-md bg-zinc-50 text-sm min-h-[40px] whitespace-pre-wrap">
                  {editingTranslation?.source_name}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">{t('modal.target-pt')}</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>
            {editingTranslation?.summary && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">{t('modal.summary')} (ES)</Label>
                  <div className="p-2 border border-zinc-200 rounded-md bg-zinc-50 text-sm min-h-[40px] whitespace-pre-wrap">
                    {editingTranslation?.source_summary}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">{t('modal.summary')} (PT)</Label>
                  <Textarea
                    value={editForm.summary}
                    onChange={(e) => setEditForm((f) => ({ ...f, summary: e.target.value }))}
                    className="text-sm min-h-[60px]"
                  />
                </div>
              </div>
            )}
            {editingTranslation?.description && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">{t('modal.description')} (ES)</Label>
                  <div className="p-2 border border-zinc-200 rounded-md bg-zinc-50 text-sm min-h-[60px] whitespace-pre-wrap">
                    {editingTranslation?.source_description}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">{t('modal.description')} (PT)</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    className="text-sm min-h-[80px]"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingTranslation(null)}>
                {ct('cancel')}
              </Button>
              <Button onClick={handleSaveReview} disabled={saving}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {saving ? t('action.saving') : t('action.mark-reviewed')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
