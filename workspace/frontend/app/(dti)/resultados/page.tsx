'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useResults } from '@/sdk/hooks/useResults';
import { getScopes, getMemberTypes, getTypologies } from '@/sdk/api/evaluations-api';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import ResultsChartsSection from '@/components/organisms/ResultsChartsSection';
import ResultsFilters from '@/components/organisms/results/ResultsFilters';
import { getAxisOptions } from '@/lib/display-names';
import { useDestino } from '@/context/destino-context';
import { toast } from 'sonner';
import { Download, BarChart3 } from 'lucide-react';

export default function ResultsPage() {
  const locale = useLocale();
  const t = useTranslations('page.resultados');
  const bt = useTranslations('breadcrumb');
  const [year, setYear] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [selectedAxis, setSelectedAxis] = useState('');
  const [selectedMemberType, setSelectedMemberType] = useState('');
  const [selectedTypology, setSelectedTypology] = useState('');
  const [searched, setSearched] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const { activeDestino, isLoadingDestino } = useDestino();

  // Auto-search once destination context is loaded
  useEffect(() => {
    if (!isLoadingDestino && !searched) {
      setSearched(true);
    }
  }, [isLoadingDestino]);

  const handleExportPdf = async () => {
    if (!contentRef.current) return;
    setExporting(true);

    // html2canvas doesn't understand oklch() (Tailwind v4).
    // Temporarily replace oklch values in the ORIGINAL document stylesheets.
    const backups: Array<{ el: HTMLStyleElement; text: string }> = [];
    document.querySelectorAll('style').forEach((style) => {
      if (style.textContent?.includes('oklch(')) {
        backups.push({ el: style, text: style.textContent });
        style.textContent = style.textContent.replace(
          /oklch\(([0-9.]+)\s+[^)]+\)/g,
          (_, l) => {
            const gray = Math.round(parseFloat(l) * 255);
            return `rgb(${gray},${gray},${gray})`;
          },
        );
      }
    });

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('resultados-auto-insight.pdf');
    } catch {
      toast.error(t('export-error'));
    } finally {
      // Restore original stylesheets
      backups.forEach(({ el, text }) => { el.textContent = text; });
      setExporting(false);
    }
  };

  const { data: scopes } = useSWR('scopes', () => getScopes());
  const { data: memberTypes } = useSWR('member-types', () => getMemberTypes());
  const { data: typologies } = useSWR('typologies', () => getTypologies());

  const { results, isLoading, error } = useResults(
    searched ? {
      year: year ? Number(year) : undefined,
      scope_id: selectedScopes.length === 1 ? selectedScopes[0] : undefined,
      axis: selectedAxis || undefined,
      member_type_id: selectedMemberType || undefined,
      destination_id: activeDestino?.id || undefined,
      typology_id: selectedTypology || undefined,
    } : undefined,
  );

  const handleSearch = () => setSearched(true);

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-zinc-500 text-sm">{bt('destino')}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-zinc-500 text-sm">{bt('analizar')}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium text-zinc-900">{bt('resultados')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title row */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('description')}</p>
        </div>
        {results && (
          <Button variant="outline" onClick={handleExportPdf} disabled={exporting} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {exporting ? t('exportando') : t('exportar-pdf')}
          </Button>
        )}
      </div>

      <ResultsFilters
        year={year} setYear={setYear}
        selectedScopes={selectedScopes} setSelectedScopes={setSelectedScopes}
        selectedAxis={selectedAxis} setSelectedAxis={setSelectedAxis}
        selectedTypology={selectedTypology} setSelectedTypology={setSelectedTypology}
        selectedMemberType={selectedMemberType} setSelectedMemberType={setSelectedMemberType}
        scopes={scopes} typologies={typologies} memberTypes={memberTypes}
        onSearch={handleSearch}
      />

      {/* Results */}
      {!searched ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>{t('select-filters')}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : error ? (
        <Card><CardContent className="p-6 text-red-500">{t('error', { message: error.message })}</CardContent></Card>
      ) : results && results.length > 0 ? (
        <div ref={contentRef}>
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t('destinos-evaluados')}</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{results.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t('completitud-global')}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{(results.reduce((a, r) => a + r.total_compliance, 0) / results.length).toFixed(1)}%</p>
                <Progress value={results.reduce((a, r) => a + r.total_compliance, 0) / results.length} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t('indicadores-completados')}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {results.reduce((a, r) => a + (r.completed_indicators || 0), 0)}/{results.reduce((a, r) => a + (r.total_indicators || 0), 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detail table */}
          <Card>
            <CardHeader><CardTitle>{t('detalle-general')}</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.destino')}</TableHead>
                    <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.pais')}</TableHead>
                    <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.indicators')}</TableHead>
                    <TableHead className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{t('table.global-compliance')}</TableHead>
                    {getAxisOptions(locale).map((a) => (
                      <TableHead key={a.value} className="bg-zinc-50 text-zinc-500 text-[12px] font-semibold uppercase tracking-[0.02em] py-3 px-4 border-b border-zinc-200">{a.value.toUpperCase()}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.destination_id}>
                      <TableCell className="font-medium">{r.destination_name}</TableCell>
                      <TableCell>{r.country}</TableCell>
                      <TableCell>{r.completed_indicators}/{r.total_indicators}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={r.total_compliance} className="w-20" />
                          <span className="text-sm">{r.total_compliance.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      {getAxisOptions(locale).map((a) => (
                        <TableCell key={a.value}>
                          {r.percentage_by_axis?.[a.value] != null ? `${r.percentage_by_axis[a.value]}%` : '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Charts section */}
          <Separator className="my-4" />
          <h2 className="text-xl font-semibold">{t('visualizaciones')}</h2>
          <ResultsChartsSection results={results} />
        </div>
      ) : (
        <Card><CardContent className="p-6 text-center text-gray-500">{t('no-results')}</CardContent></Card>
      )}
    </div>
  );
}
