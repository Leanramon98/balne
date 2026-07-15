'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AXIS_LABELS } from '@/lib/display-names';
import type { ResultsData } from '@/types';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

interface ResultsChartsSectionProps {
  results: ResultsData[];
}

export default function ResultsChartsSection({ results }: ResultsChartsSectionProps) {
  const t = useTranslations('page.resultados.chart');
  if (!results || results.length === 0) return null;

  // 1. Cumplimiento por ámbito (barras)
  const complianceByScope = buildComplianceByScope(results);

  // 2. Cumplimiento total por destino (barras)
  const totalCompliance = results.map((r) => ({
    name: r.destination_name,
    cumplimiento: Math.round(r.total_compliance * 10) / 10,
  })).sort((a, b) => b.cumplimiento - a.cumplimiento);

  // 3. Por indicador — aggregated per scope
  const byScopeData = buildByScopeData(results);

  // 4. Por ejes
  const axisData = buildAxisData(results);

  // 5. Distribución ámbito — pie
  const scopeDistribution = buildScopeDistribution(results);

  // 6. Por tipología
  const typologyData = buildTypologyData(results, t('label-no-typology'));

  // 7. Por país
  const countryData = buildCountryData(results, t('label-no-country'));

  // 8. Por rango de población
  const populationData = buildPopulationData(results, t('label-no-classification'));

  return (
    <div className="space-y-6">
      {/* 1. Cumplimiento por ámbito */}
      <Card>
        <CardHeader><CardTitle>{t('compliance-by-scope')}</CardTitle></CardHeader>
        <CardContent>
          {complianceByScope.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceByScope}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="cumplimiento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('no-scope-data')}</p>
          )}
        </CardContent>
      </Card>

      {/* 2. Cumplimiento total */}
      <Card>
        <CardHeader><CardTitle>{t('total-compliance')}</CardTitle></CardHeader>
        <CardContent>
          {totalCompliance.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, totalCompliance.length * 40)}>
              <BarChart data={totalCompliance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="cumplimiento" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('no-compliance-data')}</p>
          )}
        </CardContent>
      </Card>

      {/* 3. Por requisito/indicador */}
      <Card>
        <CardHeader><CardTitle>{t('by-scope-indicators')}</CardTitle></CardHeader>
        <CardContent>
          {byScopeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byScopeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completados" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totales" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('no-indicator-data')}</p>
          )}
        </CardContent>
      </Card>

      {/* 4. Por ejes */}
      <Card>
        <CardHeader><CardTitle>{t('by-axis')}</CardTitle></CardHeader>
        <CardContent>
          {axisData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={axisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="cumplimiento" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('no-axis-data')}</p>
          )}
        </CardContent>
      </Card>

      {/* 5. Distribución ámbito */}
      <Card>
        <CardHeader><CardTitle>{t('scope-distribution')}</CardTitle></CardHeader>
        <CardContent>
          {scopeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scopeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {scopeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('no-distribution-data')}</p>
          )}
        </CardContent>
      </Card>

      {/* 6. Por tipología */}
      <Card>
        <CardHeader><CardTitle>{t('by-typology')}</CardTitle></CardHeader>
        <CardContent>
          {typologyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typologyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="cumplimiento" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('no-typology-data')}</p>
          )}
        </CardContent>
      </Card>

      {/* 7. Por país */}
      <Card>
        <CardHeader><CardTitle>{t('by-country')}</CardTitle></CardHeader>
        <CardContent>
          {countryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, countryData.length * 40)}>
              <BarChart data={countryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="cumplimiento" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('no-country-data')}</p>
          )}
        </CardContent>
      </Card>

      {/* 8. Por rango de población */}
      <Card>
        <CardHeader><CardTitle>{t('by-population')}</CardTitle></CardHeader>
        <CardContent>
          {populationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={populationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="cumplimiento" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('no-population-data')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Helper functions ─────────────────────────────────────────────────────

function buildComplianceByScope(results: ResultsData[]) {
  if (!results.length || !results[0].percentage_by_scope) return [];

  const scopeMap: Record<string, number[]> = {};
  for (const r of results) {
    for (const [scopeId, pct] of Object.entries(r.percentage_by_scope || {})) {
      if (!scopeMap[scopeId]) scopeMap[scopeId] = [];
      scopeMap[scopeId].push(pct);
    }
  }

  return Object.entries(scopeMap).map(([name, vals]) => ({
    name,
    cumplimiento: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
  }));
}

function buildByScopeData(results: ResultsData[]) {
  const scopeMap: Record<string, { completados: number; totales: number }> = {};
  for (const r of results) {
    for (const [scopeId, completed] of Object.entries(r.completed_by_scope || {})) {
      const total = r.total_by_scope?.[scopeId] || 0;
      if (!scopeMap[scopeId]) scopeMap[scopeId] = { completados: 0, totales: 0 };
      scopeMap[scopeId].completados += completed;
      scopeMap[scopeId].totales += total;
    }
  }

  return Object.entries(scopeMap).map(([name, data]) => ({
    name,
    ...data,
  }));
}

function buildAxisData(results: ResultsData[]) {
  if (!results.length || !results[0].percentage_by_axis) return [];

  const axisMap: Record<string, number[]> = {};
  const axisLabels: Record<string, string> = AXIS_LABELS;

  for (const r of results) {
    for (const [axis, pct] of Object.entries(r.percentage_by_axis || {})) {
      if (!axisMap[axis]) axisMap[axis] = [];
      axisMap[axis].push(pct as number);
    }
  }

  return Object.entries(axisMap).map(([axis, vals]) => ({
    name: axisLabels[axis] || axis.toUpperCase(),
    cumplimiento: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
  }));
}

function buildScopeDistribution(results: ResultsData[]) {
  if (!results.length || !results[0].percentage_by_scope) return [];

  const scopeMap: Record<string, number> = {};
  for (const r of results) {
    for (const [scopeId, pct] of Object.entries(r.percentage_by_scope || {})) {
      scopeMap[scopeId] = (scopeMap[scopeId] || 0) + pct;
    }
  }

  return Object.entries(scopeMap).map(([name, value]) => ({
    name,
    value: Math.round(value * 10) / 10,
  }));
}

function buildTypologyData(results: ResultsData[], noTypologyLabel: string) {
  const typedResults = results.filter((r) => r.typology);
  if (!typedResults.length) return [];

  const map: Record<string, number[]> = {};
  for (const r of typedResults) {
    const key = r.typology || noTypologyLabel;
    if (!map[key]) map[key] = [];
    map[key].push(r.total_compliance);
  }

  return Object.entries(map).map(([name, vals]) => ({
    name,
    cumplimiento: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
  }));
}

function buildCountryData(results: ResultsData[], noCountryLabel: string) {
  const map: Record<string, number[]> = {};
  for (const r of results) {
    const key = r.country || noCountryLabel;
    if (!map[key]) map[key] = [];
    map[key].push(r.total_compliance);
  }

  return Object.entries(map).map(([name, vals]) => ({
    name,
    cumplimiento: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
  }));
}

function buildPopulationData(results: ResultsData[], noClassificationLabel: string) {
  const map: Record<string, number[]> = {};
  for (const r of results) {
    const key = r.population_range || noClassificationLabel;
    if (!map[key]) map[key] = [];
    map[key].push(r.total_compliance);
  }

  return Object.entries(map).map(([name, vals]) => ({
    name,
    cumplimiento: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
  }));
}
