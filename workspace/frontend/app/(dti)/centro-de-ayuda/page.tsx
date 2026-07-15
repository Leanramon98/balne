'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/sdk/auth/AuthContext';
import { cn } from '@/lib/utils';
import {
  Home,
  Activity,
  ClipboardList,
  Target,
  TrendingUp,
  HelpCircle,
  Search,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  ImageIcon,
  HelpCircle as HelpIcon,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/atoms/ErrorBoundary';
import { FALLBACK_DATA, localeValue, type HelpStep, type HelpTopic, type HelpCenterData } from './_data';

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, React.ElementType> = {
  Home, Activity, ClipboardList, Target, TrendingUp, HelpCircle,
};

const ICON_OPTIONS = [
  { value: 'Home', label: 'Inicio', icon: Home },
  { value: 'Activity', label: 'Actividad', icon: Activity },
  { value: 'ClipboardList', label: 'Lista', icon: ClipboardList },
  { value: 'Target', label: 'Objetivo', icon: Target },
  { value: 'TrendingUp', label: 'Tendencia', icon: TrendingUp },
  { value: 'HelpCircle', label: 'Ayuda', icon: HelpCircle },
];

/* ------------------------------------------------------------------ */
/*  Fetcher                                                            */
/* ------------------------------------------------------------------ */

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ------------------------------------------------------------------ */
/*  Sub-component: HelpCenterView                                      */
/* ------------------------------------------------------------------ */

function HelpCenterView({
  topics,
  isAdmin,
  onStartEdit,
}: {
  topics: HelpTopic[];
  isAdmin: boolean;
  onStartEdit: () => void;
}) {
  const t = useTranslations('page.centro-de-ayuda');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const sorted = useMemo(() => [...topics].sort((a, b) => a.order - b.order), [topics]);

  // Set initial topic
  useEffect(() => {
    if (sorted.length > 0 && !selectedTopicId) {
      setSelectedTopicId(sorted[0].id);
    }
  }, [sorted, selectedTopicId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
            (t) =>
        localeValue(t.title_es, t.title_pt, locale).toLowerCase().includes(q) ||
        t.steps.some((s) => localeValue(s.title_es, s.title_pt, locale).toLowerCase().includes(q) || localeValue(s.description_es, s.description_pt, locale).toLowerCase().includes(q))
    );
  }, [sorted, search]);

  const active = useMemo(
    () => filtered.find((t) => t.id === selectedTopicId) || filtered[0],
    [filtered, selectedTopicId]
  );

  const step = active?.steps[currentStepIndex];

  return (
    <div className="px-6 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
            <HelpIcon className="h-5 w-5 text-zinc-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{t('title')}</h1>
            <p className="text-sm text-zinc-500 mt-1">{t('subtitle')}</p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={onStartEdit} className="gap-2">
            <Pencil className="h-4 w-4" />
            Editar contenido
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder={t('search-placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              {t('themes-label')}
            </p>
            <div className="space-y-1">
              {filtered.map((topic) => {
                const isActive = topic.id === active?.id;
                const Icon = ICON_MAP[topic.icon] || HelpCircle;
                return (
                  <button
                    key={topic.id}
                    onClick={() => { setSelectedTopicId(topic.id); setCurrentStepIndex(0); }}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      isActive ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
                    )}
                  >
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', isActive ? 'bg-white' : 'bg-zinc-100')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{localeValue(topic.title_es, topic.title_pt, locale)}</p>
                      <p className="text-xs text-zinc-400">{localeValue(
                        topic.steps.length + ' paso' + (topic.steps.length !== 1 ? 's' : ''),
                        topic.steps.length + ' passo' + (topic.steps.length !== 1 ? 's' : ''),
                        locale
                      )}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <p className="text-sm text-zinc-400 py-4 text-center">No se encontraron temas</p>
            )}
          </div>

        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {active ? (
            <>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{localeValue(active.title_es, active.title_pt, locale)}</h2>
                {active.description_es && <p className="text-sm text-zinc-500 mt-1">{localeValue(active.description_es, active.description_pt, locale)}</p>}
              </div>

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  {t('step-label', { step: currentStepIndex + 1, total: active.steps.length })}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
                    disabled={currentStepIndex === 0}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
                      currentStepIndex === 0 ? 'border-zinc-200 text-zinc-300 cursor-not-allowed' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50'
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentStepIndex((i) => Math.min(active.steps.length - 1, i + 1))}
                    disabled={currentStepIndex === active.steps.length - 1}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
                      currentStepIndex === active.steps.length - 1 ? 'border-zinc-200 text-zinc-300 cursor-not-allowed' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50'
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                {active.steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={cn('h-2 rounded-full transition-all', idx === currentStepIndex ? 'w-6 bg-zinc-800' : 'w-2 bg-zinc-300 hover:bg-zinc-400')}
                  />
                ))}
              </div>

              {step && (
                <div className="rounded-xl border border-zinc-200 bg-white p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-sm font-bold text-zinc-700">{currentStepIndex + 1}</div>
                    <h3 className="text-lg font-bold text-zinc-900">{localeValue(step.title_es, step.title_pt, locale)}</h3>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed mb-6">{localeValue(step.description_es, step.description_pt, locale)}</p>

                  <div className={cn(
                    'relative rounded-xl overflow-hidden mb-5',
                    step.image
                      ? 'border border-zinc-200'
                      : 'border-2 border-dashed border-zinc-200 bg-zinc-50 aspect-video flex flex-col items-center justify-center'
                  )}>
                    {step.image ? (
                      <img src={step.image} alt={localeValue(step.title_es, step.title_pt, locale)} className="w-full h-auto" />
                    ) : (
                      <>
                        <div className="mb-3 rounded-lg bg-[#040927] px-3 py-1.5 text-xs font-medium text-white">{localeValue(active.title_es, active.title_pt, locale)}</div>
                        <ImageIcon className="h-8 w-8 text-zinc-300 mb-2" />
                        <p className="text-sm text-zinc-400">Soltá la captura de: {localeValue(step.title_es, step.title_pt, locale)}</p>
                        <p className="text-xs text-zinc-400 mt-1">o <span className="underline cursor-pointer">browse files</span></p>
                      </>
                    )}
                  </div>

                  {(localeValue(step.tip_es, step.tip_pt, locale)) && (
                    <div className="flex items-start gap-2 rounded-lg bg-zinc-50 p-3">
                      <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                      <p className="text-sm text-zinc-600"><span className="font-semibold">{t('tip-label')}</span> {localeValue(step.tip_es, step.tip_pt, locale)}</p>
                    </div>
                  )}
                </div>
              )}

              {!step && active.steps.length === 0 && (
                <p className="text-sm text-zinc-400 text-center py-8">{localeValue('Este tema no tiene pasos todavía.', 'Este tema ainda não tem passos.', locale)}</p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <HelpCircle className="h-12 w-12 mb-4" />
              <p className="text-sm">Seleccioná un tema para ver su contenido</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component: HelpCenterEditor                                    */
/* ------------------------------------------------------------------ */

function HelpCenterEditor({
  data,
  onSave,
  onCancel,
}: {
  data: HelpCenterData;
  onSave: (data: HelpCenterData) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations('page.centro-de-ayuda');
  const [editLocale, setEditLocale] = useState<'es' | 'pt'>('es');
  const [editData, setEditData] = useState<HelpCenterData>(() => JSON.parse(JSON.stringify(data)));
  const [saving, setSaving] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(editData.topics[0]?.id || '');
  const [selectedStepIdx, setSelectedStepIdx] = useState(0);

  const sorted = useMemo(() => [...editData.topics].sort((a, b) => a.order - b.order), [editData.topics]);
  const activeTopic = sorted.find((t) => t.id === selectedTopicId) || sorted[0];

  // Helpers
  const updateTopic = (id: string, fields: Partial<HelpTopic>) => {
    setEditData((prev) => ({
      ...prev,
      topics: prev.topics.map((t) => (t.id === id ? { ...t, ...fields } : t)),
    }));
  };

  const updateStep = (topicId: string, stepId: string, fields: Partial<HelpStep>) => {
    setEditData((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.id === topicId
          ? { ...t, steps: t.steps.map((s) => (s.id === stepId ? { ...s, ...fields } : s)) }
          : t
      ),
    }));
  };

  const addTopic = () => {
    const id = `topic-${Date.now()}`;
    setEditData((prev) => ({
      ...prev,
      topics: [...prev.topics, { id, icon: 'HelpCircle', title_es: 'Nuevo tema', title_pt: 'Novo tema', description_es: '', description_pt: '', order: prev.topics.length, steps: [] }],
    }));
    setSelectedTopicId(id);
  };

  const deleteTopic = (id: string) => {
    setEditData((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t.id !== id).map((t, i) => ({ ...t, order: i })),
    }));
    if (selectedTopicId === id) {
      setSelectedTopicId(sorted.find((t) => t.id !== id)?.id || '');
    }
  };

  const moveTopic = (id: string, dir: -1 | 1) => {
    setEditData((prev) => {
      const idx = prev.topics.findIndex((t) => t.id === id);
      if (idx === -1 || idx + dir < 0 || idx + dir >= prev.topics.length) return prev;
      const next = [...prev.topics];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      return { ...prev, topics: next.map((t, i) => ({ ...t, order: i })) };
    });
  };

  const addStep = () => {
    if (!activeTopic) return;
    const id = `step-${Date.now()}`;
    updateTopic(activeTopic.id, {
      steps: [...activeTopic.steps, { id, title_es: 'Nuevo paso', title_pt: 'Novo passo', description_es: '', description_pt: '', order: activeTopic.steps.length }],
    });
  };

  const deleteStep = (stepId: string) => {
    if (!activeTopic) return;
    updateTopic(activeTopic.id, {
      steps: activeTopic.steps.filter((s) => s.id !== stepId).map((s, i) => ({ ...s, order: i })),
    });
  };

  const moveStep = (stepId: string, dir: -1 | 1) => {
    if (!activeTopic) return;
    const idx = activeTopic.steps.findIndex((s) => s.id === stepId);
    if (idx === -1 || idx + dir < 0 || idx + dir >= activeTopic.steps.length) return;
    const next = [...activeTopic.steps];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    updateTopic(activeTopic.id, { steps: next.map((s, i) => ({ ...s, order: i })) });
  };

  const handleImageUpload = async (stepId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/help-center/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      updateStep(activeTopic.id, stepId, { image: url });
      toast.success('Imagen subida');
    } catch (err: any) {
      toast.error('Error al subir imagen: ' + err.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete removed topics
      for (const orig of data.topics) {
        if (!editData.topics.find((t) => t.id === orig.id)) {
          const r = await fetch(`/api/help-center/${orig.id}`, { method: 'DELETE' });
          if (!r.ok) throw new Error(`Error al eliminar "${orig.title_es}"`);
        }
      }
      // Create new topics first (need server ID)
      const idMap: Record<string, string> = {};
      for (const topic of editData.topics) {
        if (topic.id.startsWith('topic-') && !data.topics.find((t) => t.id === topic.id)) {
          const r = await fetch('/api/help-center', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title_es: topic.title_es, title_pt: topic.title_pt, icon: topic.icon }),
          });
          if (!r.ok) throw new Error(`Error al crear "${topic.title_es}"`);
          const created = await r.json();
          idMap[topic.id] = created.id;
        }
      }
      // Update all topics with correct order
      const allTopics = editData.topics.map((t) => ({
        ...t,
        id: idMap[t.id] || t.id,
      }));
      for (const topic of allTopics) {
        const r = await fetch(`/api/help-center/${topic.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title_es: topic.title_es,
            title_pt: topic.title_pt,
            description_es: topic.description_es,
            description_pt: topic.description_pt,
            icon: topic.icon,
            order: topic.order,
            steps: topic.steps.map((s, i) => ({
              ...s,
              order: i,
            })),
          }),
        });
        if (!r.ok) {
          const body = await r.text().catch(() => '');
          throw new Error(`Error al guardar "${topic.title_es}" (${r.status}): ${body}`);
        }
      }
      onSave(editData);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
            <Pencil className="h-5 w-5 text-zinc-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Editar centro de ayuda</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {editLocale === 'es' ? 'Editando contenido en español' : 'Editando conteúdo em português'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Locale switcher */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white text-sm">
            <button
              onClick={() => setEditLocale('es')}
              className={cn(
                'px-3 py-1.5 rounded-l-lg font-medium transition-colors',
                editLocale === 'es' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-800'
              )}
            >ES</button>
            <button
              onClick={() => setEditLocale('pt')}
              className={cn(
                'px-3 py-1.5 rounded-r-lg font-medium transition-colors',
                editLocale === 'pt' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-800'
              )}
            >PT</button>
          </div>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving} className="gap-2">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">TEMAS</p>
            <button onClick={addTopic} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
              <Plus className="h-3 w-3" />
              Nuevo
            </button>
          </div>
          <div className="space-y-1">
            {sorted.map((topic) => {
              const isActive = topic.id === activeTopic?.id;
              return (
                <div key={topic.id} className={cn('flex items-center rounded-lg', isActive ? 'bg-zinc-100' : 'hover:bg-zinc-50')}>
                  <button
                    onClick={() => { setSelectedTopicId(topic.id); setSelectedStepIdx(0); }}
                    className="flex-1 text-left px-3 py-2 text-sm font-medium truncate"
                  >
                    {localeValue(topic.title_es, topic.title_pt, editLocale)}
                  </button>
                  <div className="flex pr-1">
                    <button onClick={() => moveTopic(topic.id, -1)} disabled={topic.order === 0} className="flex h-5 w-5 items-center justify-center text-zinc-300 hover:text-zinc-600 disabled:opacity-30">
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button onClick={() => moveTopic(topic.id, 1)} disabled={topic.order === sorted.length - 1} className="flex h-5 w-5 items-center justify-center text-zinc-300 hover:text-zinc-600 disabled:opacity-30">
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => deleteTopic(topic.id)} className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 mr-1" title="Eliminar tema">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Editor */}
        <div className="flex-1 min-w-0 space-y-4">
          {activeTopic ? (
            <>
              {/* Topic fields */}
              <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <select
                  value={activeTopic.icon}
                  onChange={(e) => updateTopic(activeTopic.id, { icon: e.target.value })}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-2 text-sm"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <Input
                  value={activeTopic.title_es}
                  onChange={(e) => updateTopic(activeTopic.id, { title_es: e.target.value })}
                  className="font-medium"
                  placeholder={editLocale === 'es' ? 'Título del tema (ES)' : 'Título do tema (ES)'}
                />
                <Input
                  value={activeTopic.title_pt}
                  onChange={(e) => updateTopic(activeTopic.id, { title_pt: e.target.value })}
                  className="font-medium"
                  placeholder={editLocale === 'es' ? 'Título del tema (PT)' : 'Título do tema (PT)'}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Textarea value={activeTopic.description_es} onChange={(e) => updateTopic(activeTopic.id, { description_es: e.target.value })} className="min-h-[60px] text-sm" placeholder={editLocale === 'es' ? 'Descripción (ES)...' : 'Descrição (ES)...'} />
                <Textarea value={activeTopic.description_pt} onChange={(e) => updateTopic(activeTopic.id, { description_pt: e.target.value })} className="min-h-[60px] text-sm" placeholder={editLocale === 'es' ? 'Descripción (PT)...' : 'Descrição (PT)...'} />
              </div>
              </div>

              {/* Steps */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">PASOS ({activeTopic.steps.length})</span>
                <Button variant="outline" size="sm" onClick={addStep} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Agregar paso
                </Button>
              </div>

              {activeTopic.steps.length === 0 && (
                <p className="text-sm text-zinc-400 text-center py-8">No hay pasos. Hacé clic en "Agregar paso".</p>
              )}

              {activeTopic.steps.map((step, idx) => (
                <div key={step.id} className="rounded-xl border border-zinc-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-700">{idx + 1}</div>
                      <span className="text-xs font-semibold text-zinc-400 uppercase">Paso {idx + 1} de {activeTopic.steps.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveStep(step.id, -1)} disabled={idx === 0} className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 hover:text-zinc-600 disabled:opacity-30">
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => moveStep(step.id, 1)} disabled={idx === activeTopic.steps.length - 1} className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 hover:text-zinc-600 disabled:opacity-30">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteStep(step.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 hover:text-red-500 hover:bg-red-50" title="Eliminar paso">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={step.title_es} onChange={(e) => updateStep(activeTopic.id, step.id, { title_es: e.target.value })} placeholder={editLocale === 'es' ? 'Título (ES)' : 'Título (ES)'} className="font-medium" />
                      <Input value={step.title_pt} onChange={(e) => updateStep(activeTopic.id, step.id, { title_pt: e.target.value })} placeholder={editLocale === 'es' ? 'Título (PT)' : 'Título (PT)'} className="font-medium" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Textarea value={step.description_es} onChange={(e) => updateStep(activeTopic.id, step.id, { description_es: e.target.value })} placeholder={editLocale === 'es' ? 'Descripción (ES)' : 'Descrição (ES)'} className="min-h-[80px] text-sm" />
                      <Textarea value={step.description_pt} onChange={(e) => updateStep(activeTopic.id, step.id, { description_pt: e.target.value })} placeholder={editLocale === 'es' ? 'Descripción (PT)' : 'Descrição (PT)'} className="min-h-[80px] text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={step.tip_es || ''} onChange={(e) => updateStep(activeTopic.id, step.id, { tip_es: e.target.value || undefined })} placeholder={editLocale === 'es' ? 'Tip (ES, opcional)' : 'Dica (ES, opcional)'} className="text-sm" />
                      <Input value={step.tip_pt || ''} onChange={(e) => updateStep(activeTopic.id, step.id, { tip_pt: e.target.value || undefined })} placeholder={editLocale === 'es' ? 'Tip (PT, opcional)' : 'Dica (PT, opcional)'} className="text-sm" />
                    </div>
                    <div>
                      {step.image ? (
                        <div className="relative rounded-lg overflow-hidden border border-zinc-200">
                          <img src={step.image} alt={localeValue(step.title_es, step.title_pt, editLocale)} className="w-full h-40 object-cover" />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleImageUpload(step.id, f); }; i.click(); }} className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-zinc-600 hover:bg-white shadow-sm" title="Cambiar imagen">
                              <Upload className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => updateStep(activeTopic.id, step.id, { image: undefined })} className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-red-500 hover:bg-white shadow-sm" title="Quitar imagen">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 p-3 text-sm text-zinc-400 hover:border-zinc-300 hover:text-zinc-500 transition-colors">
                          <Upload className="h-4 w-4" />
                          Subir imagen para este paso
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(step.id, f); }} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-20">Seleccioná o creá un tema para editarlo</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function CentroDeAyudaPage() {
  const t = useTranslations('page.centro-de-ayuda');
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin') ?? false;

  const { data, error, mutate } = useSWR<HelpCenterData>(
    '/api/help-center',
    fetcher,
    { fallbackData: FALLBACK_DATA, revalidateOnFocus: true }
  );

  const topics = data?.topics ?? FALLBACK_DATA.topics;
  const hasApiError = !!error;
  const [isEditing, setIsEditing] = useState(false);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    await mutate();
    setIsEditing(false);
    toast.success('Contenido guardado correctamente');
  };

  return (
    <ErrorBoundary>
      {hasApiError && !isEditing && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 mx-6 mt-6 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          No se pudo conectar con el servidor. Mostrando contenido local.
        </div>
      )}

      {isEditing ? (
        <ErrorBoundary>
          <HelpCenterEditor
            data={{ topics }}
            onSave={handleSave}
            onCancel={handleCancelEdit}
          />
        </ErrorBoundary>
      ) : (
        <HelpCenterView
          topics={topics}
          isAdmin={isAdmin}
          onStartEdit={handleStartEdit}
        />
      )}
    </ErrorBoundary>
  );
}
