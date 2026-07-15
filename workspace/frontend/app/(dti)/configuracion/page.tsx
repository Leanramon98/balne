'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import UsersTab from '@/components/organisms/config/UsersConfig';
import DestinosTab from '@/components/organisms/config/DestinationsConfig';
import IndicatorsTab from '@/components/organisms/config/IndicatorsConfig';
import ScopesTab from '@/components/organisms/config/ScopesConfig';
import RequisitosTab from '@/components/organisms/config/RequirementsConfig';
import NivelesTab from '@/components/organisms/config/NivelesConfig';
import MiembrosTab from '@/components/organisms/config/MiembrosConfig';
import AreasTab from '@/components/organisms/config/AreasConfig';
import EjesTab from '@/components/organisms/config/EjesConfig';
import TipologiasTab from '@/components/organisms/config/TipologiasConfig';
import RangosTab from '@/components/organisms/config/RangosConfig';
import RegionesTab from '@/components/organisms/config/RegionesConfig';
import MapaTab from '@/components/organisms/config/MapaConfig';
import AccesosTab from '@/components/organisms/config/AccesosConfig';
import TranslationsTab from '@/components/organisms/config/TranslationsTab';
import ContentTranslationsTab from '@/components/organisms/config/ContentTranslationsTab';
import { ContentTransition } from '@/components/atoms/ContentTransition';

export default function AdminConfigPage() {
  const [activeTab, setActiveTab] = useState('usuarios');
  const bt = useTranslations('breadcrumb');
  const pt = useTranslations('page.configuracion');

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
            <BreadcrumbPage className="text-zinc-500 text-sm">{bt('administrar')}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium text-zinc-900">{bt('configuracion')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pt('title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{pt('description')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="usuarios">{pt('tabs.usuarios')}</TabsTrigger>
          <TabsTrigger value="destinos">{pt('tabs.destinos')}</TabsTrigger>
          <TabsTrigger value="ambitos">{pt('tabs.ambitos')}</TabsTrigger>
          <TabsTrigger value="indicadores">{pt('tabs.indicadores')}</TabsTrigger>
          <TabsTrigger value="niveles">{pt('tabs.niveles')}</TabsTrigger>
          <TabsTrigger value="accesos">{pt('tabs.accesos')}</TabsTrigger>
          <TabsTrigger value="miembros">{pt('tabs.miembros')}</TabsTrigger>
          <TabsTrigger value="areas">{pt('tabs.areas')}</TabsTrigger>
          <TabsTrigger value="ejes">{pt('tabs.ejes')}</TabsTrigger>
          <TabsTrigger value="tipologias">{pt('tabs.tipologias')}</TabsTrigger>
          <TabsTrigger value="rangos">{pt('tabs.rangos')}</TabsTrigger>
          <TabsTrigger value="regiones">{pt('tabs.regiones')}</TabsTrigger>
          <TabsTrigger value="mapa">{pt('tabs.mapa')}</TabsTrigger>
          <TabsTrigger value="requisitos">{pt('tabs.requisitos')}</TabsTrigger>
          <TabsTrigger value="traducciones">{pt('tabs.traducciones')}</TabsTrigger>
          <TabsTrigger value="contenido-dinamico">{pt('tabs.contenido-dinamico')}</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios"><ContentTransition trigger="usuarios"><UsersTab /></ContentTransition></TabsContent>
        <TabsContent value="destinos"><ContentTransition trigger="destinos"><DestinosTab /></ContentTransition></TabsContent>
        <TabsContent value="ambitos"><ContentTransition trigger="ambitos"><ScopesTab /></ContentTransition></TabsContent>
        <TabsContent value="indicadores"><ContentTransition trigger="indicadores"><IndicatorsTab /></ContentTransition></TabsContent>
        <TabsContent value="niveles"><ContentTransition trigger="niveles"><NivelesTab /></ContentTransition></TabsContent>
        <TabsContent value="accesos"><ContentTransition trigger="accesos"><AccesosTab /></ContentTransition></TabsContent>
        <TabsContent value="miembros"><ContentTransition trigger="miembros"><MiembrosTab /></ContentTransition></TabsContent>
        <TabsContent value="areas"><ContentTransition trigger="areas"><AreasTab /></ContentTransition></TabsContent>
        <TabsContent value="ejes"><ContentTransition trigger="ejes"><EjesTab /></ContentTransition></TabsContent>
        <TabsContent value="tipologias"><ContentTransition trigger="tipologias"><TipologiasTab /></ContentTransition></TabsContent>
        <TabsContent value="rangos"><ContentTransition trigger="rangos"><RangosTab /></ContentTransition></TabsContent>
        <TabsContent value="regiones"><ContentTransition trigger="regiones"><RegionesTab /></ContentTransition></TabsContent>
        <TabsContent value="mapa"><ContentTransition trigger="mapa"><MapaTab /></ContentTransition></TabsContent>
        <TabsContent value="requisitos"><ContentTransition trigger="requisitos"><RequisitosTab /></ContentTransition></TabsContent>
        <TabsContent value="traducciones"><ContentTransition trigger="traducciones"><TranslationsTab /></ContentTransition></TabsContent>
        <TabsContent value="contenido-dinamico"><ContentTransition trigger="contenido-dinamico"><ContentTranslationsTab /></ContentTransition></TabsContent>
      </Tabs>
    </div>
  );
}
