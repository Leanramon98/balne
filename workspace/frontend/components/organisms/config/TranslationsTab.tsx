'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { mutate as swrMutate } from 'swr';
import {
  getAll,
  create,
  update,
  remove,
  type TranslationOverride,
  type TranslationLocale,
} from '@/sdk/api/translation-overrides-api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import esMessages from '@/messages/es.json';
import ptMessages from '@/messages/pt.json';

const LOCALES = [
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
] as const;

interface FormState {
  locale: TranslationLocale;
  source_text: string;
  corrected_text: string;
}

const EMPTY_FORM: FormState = {
  locale: 'es',
  source_text: '',
  corrected_text: '',
};

const BASE_MESSAGES_BY_LOCALE: Record<TranslationLocale, Record<string, string>> = {
  es: esMessages,
  pt: ptMessages,
};

function getSourceText(override: TranslationOverride): string {
  if (override.source_text) return override.source_text;

  const fullKey = [override.namespace, override.key].filter(Boolean).join('.');
  if (!fullKey) return '';

  return BASE_MESSAGES_BY_LOCALE[override.locale][fullKey] ?? '';
}

function getCorrectedText(override: TranslationOverride): string {
  return override.corrected_text || override.override_value || '';
}

export default function TranslationsTab() {
  const ct = useTranslations('config');
  const commonT = useTranslations('common');

  const [filterLocale, setFilterLocale] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [overrides, setOverrides] = useState<TranslationOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TranslationOverride | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TranslationOverride | null>(null);

  useEffect(() => {
    const all = getAll(filterLocale === 'all' ? undefined : filterLocale);
    const normalizedSearch = search.toLowerCase();
    setOverrides(
      search
        ? all.filter(
            (o) =>
              getSourceText(o).toLowerCase().includes(normalizedSearch) ||
              getCorrectedText(o).toLowerCase().includes(normalizedSearch),
          )
        : all,
    );
    setLoading(false);
    // Invalidate SWR cache so DtiShell reflects changes immediately
    if (filterLocale !== 'all') {
      swrMutate(['translation-overrides', filterLocale]);
    }
  }, [filterLocale, search]);

  function refreshRuntimeCorrections() {
    swrMutate(['translation-overrides', 'es']);
    swrMutate(['translation-overrides', 'pt']);
  }

  function refreshList() {
    const all = getAll(filterLocale === 'all' ? undefined : filterLocale);
    const normalizedSearch = search.toLowerCase();
    setOverrides(
      search
        ? all.filter(
            (o) =>
              getSourceText(o).toLowerCase().includes(normalizedSearch) ||
              getCorrectedText(o).toLowerCase().includes(normalizedSearch),
          )
        : all,
    );
    setLoading(false);
    refreshRuntimeCorrections();
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(o: TranslationOverride) {
    setEditing(o);
    setForm({
      locale: o.locale,
      source_text: getSourceText(o),
      corrected_text: getCorrectedText(o),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.source_text.trim() || !form.corrected_text.trim()) return;
    setSaving(true);
    // Simulate async for consistency with future backend swap
    await new Promise((r) => setTimeout(r, 100));
    try {
      if (editing) {
        await update(editing.id, {
          locale: form.locale,
          source_text: form.source_text.trim(),
          corrected_text: form.corrected_text.trim(),
        });
      } else {
        await create({
          locale: form.locale,
          source_text: form.source_text.trim(),
          corrected_text: form.corrected_text.trim(),
        });
      }
      setDialogOpen(false);
      refreshList();
    } catch (err) {
      console.error('Failed to save override:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    setDeleteTarget(null);
    refreshList();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{ct('translations')}</CardTitle>
            <p className="text-sm text-zinc-500 mt-1">{ct('translations-desc')}</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {ct('add-override')}
          </Button>
        </div>
      </CardHeader>

      {/* Filters */}
      <div className="flex items-center gap-4 px-6 pb-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-zinc-500 shrink-0">{ct('filter-locale')}</Label>
          <Select value={filterLocale} onValueChange={setFilterLocale}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {LOCALES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder={ct('search-text')}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-sm text-zinc-500">{commonT('loading')}</div>
        ) : overrides.length === 0 ? (
          <div className="p-6 text-sm text-zinc-500">{ct('no-overrides')}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">
                  {ct('locale')}
                </TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">
                  {ct('source-text')}
                </TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">
                  {ct('corrected-text')}
                </TableHead>
                <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Badge variant={o.locale === 'pt' ? 'info' : 'secondary'}>
                      {o.locale === 'pt' ? 'PT' : 'ES'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 max-w-[320px] truncate">
                    {getSourceText(o) || '—'}
                  </TableCell>
                  <TableCell className="text-xs max-w-[320px] truncate">
                    {getCorrectedText(o)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(o)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(o)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? ct('edit-override') : ct('add-override')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Locale */}
            <div className="grid gap-2">
              <Label>{ct('locale')}</Label>
              <Select
                value={form.locale}
                onValueChange={(v) => setForm((f) => ({ ...f, locale: v as TranslationLocale }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source text */}
            <div className="grid gap-2">
              <Label>{ct('source-text')}</Label>
              <Textarea
                placeholder="Texto actual que aparece en la plataforma..."
                value={form.source_text}
                onChange={(e) => setForm((f) => ({ ...f, source_text: e.target.value }))}
              />
            </div>

            {/* Corrected text */}
            <div className="grid gap-2">
              <Label>{ct('corrected-text')}</Label>
              <Textarea
                placeholder="Texto corregido..."
                value={form.corrected_text}
                onChange={(e) => setForm((f) => ({ ...f, corrected_text: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {commonT('cancel')}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving
                  ? commonT('saving')
                  : editing
                    ? commonT('save')
                    : ct('save-override')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title={ct('delete-override')}
        description={`${ct('confirm-delete')} "${deleteTarget ? getSourceText(deleteTarget) : ''}" (${deleteTarget?.locale === 'pt' ? 'PT' : 'ES'})`}
        onConfirm={handleDelete}
        confirmText={commonT('delete')}
        variant="destructive"
      />
    </Card>
  );
}
