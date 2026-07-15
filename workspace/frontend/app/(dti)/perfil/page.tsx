'use client';

import { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserProfileForm } from '@/components/organisms/UserProfileForm';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDestino } from '@/context/destino-context';
import { getDestination } from '@/sdk/api/evaluations-api';
import { changePassword } from '@/sdk/api/users-api';
import { useAuth } from '@/sdk/auth/AuthContext';
import { useProfile, useUpdateProfile } from '@/sdk/hooks/useProfile';
import {
  CAN_SELECT_DESTINO_ROLES,
  DESTINATION_ROLES,
  EVALUATOR_ROLES,
  getUserRoles,
} from '@/lib/auth';
import { getRoleLabel } from '@/lib/display-names';
import type { Destination } from '@/types/dti';

const PROFILE_FIELD = {
  FULL_NAME: 'full_name',
  FULL_NAME_PASCAL: 'FullName',
  NAME: 'name',
  NAME_PASCAL: 'Name',
  EMAIL: 'email',
  EMAIL_PASCAL: 'Email',
  PHONE: 'phone',
  PHONE_PASCAL: 'Phone',
  USER_ID: 'user_id',
  USER_ID_PASCAL: 'UserID',
  ID: 'id',
  ID_PASCAL: 'ID',
} as const;

interface DetailRow {
  label: string;
  value: string;
}

function getProfileValue(profile: Record<string, unknown> | null, keys: string[]): string {
  if (!profile) return '';

  for (const key of keys) {
    const value = profile[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }

  return '';
}

function getDisplayName(profile: Record<string, unknown> | null, fallback: string): string {
  return getProfileValue(profile, [
    PROFILE_FIELD.FULL_NAME,
    PROFILE_FIELD.FULL_NAME_PASCAL,
    PROFILE_FIELD.NAME,
    PROFILE_FIELD.NAME_PASCAL,
    PROFILE_FIELD.EMAIL,
    PROFILE_FIELD.EMAIL_PASCAL,
  ]) || fallback;
}

function getDisplayEmail(profile: Record<string, unknown> | null, fallback: string): string {
  return getProfileValue(profile, [PROFILE_FIELD.EMAIL, PROFILE_FIELD.EMAIL_PASCAL]) || fallback;
}

function getDisplayPhone(profile: Record<string, unknown> | null): string {
  return getProfileValue(profile, [PROFILE_FIELD.PHONE, PROFILE_FIELD.PHONE_PASCAL]);
}

function getDisplayUserId(profile: Record<string, unknown> | null, fallback: string): string {
  return getProfileValue(profile, [
    PROFILE_FIELD.USER_ID,
    PROFILE_FIELD.USER_ID_PASCAL,
    PROFILE_FIELD.ID,
    PROFILE_FIELD.ID_PASCAL,
  ]) || fallback;
}

function getInitial(name: string, email: string): string {
  return (name || email || 'U').trim().charAt(0).toUpperCase();
}

function formatValue(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
}

function getDestinationRows(destination: Destination | null): DetailRow[] {
  if (!destination) return [];

  const rows: DetailRow[] = [
    { label: 'País', value: formatValue(destination.country) },
    { label: 'Adherido', value: formatValue(destination.is_adhered) },
    {
      label: 'Coordenadas',
      value: destination.lat !== undefined && destination.lng !== undefined
        ? `${destination.lat}, ${destination.lng}`
        : '',
    },
    { label: 'Tipo de miembro (ID)', value: formatValue(destination.member_type_id) },
    { label: 'Nivel subnacional (ID)', value: formatValue(destination.subnational_level_id) },
    { label: 'Tipología (ID)', value: formatValue(destination.typology_id) },
    { label: 'Rango poblacional (ID)', value: formatValue(destination.population_range_id) },
    { label: 'Región (ID)', value: formatValue(destination.region_id) },
  ];

  return rows.filter((row) => row.value !== '');
}

function hasRole(roles: string[], supportedRoles: string[]): boolean {
  return roles.some((role) => supportedRoles.includes(role));
}

function getCapabilityRows(roles: string[], canSelectDestino: boolean): DetailRow[] {
  const rows: DetailRow[] = [];

  if (canSelectDestino || hasRole(roles, CAN_SELECT_DESTINO_ROLES)) {
    rows.push({ label: 'Selección de destino', value: 'Puede seleccionar destino activo' });
  }

  if (hasRole(roles, DESTINATION_ROLES)) {
    rows.push({ label: 'Alcance de destino', value: 'Puede trabajar sobre el destino asignado o activo' });
  }

  if (hasRole(roles, EVALUATOR_ROLES)) {
    rows.push({ label: 'Evaluaciones', value: 'Puede participar en evaluaciones según su rol configurado' });
  }

  if (rows.length === 0) {
    rows.push({ label: 'Alcance', value: 'Acceso limitado según la configuración de la cuenta' });
  }

  return rows;
}

function DetailList({ rows }: { rows: DetailRow[] }) {
  return (
    <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-white">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3">
          <span className="text-sm text-zinc-500">{row.label}</span>
          <span className="text-right text-sm font-medium text-zinc-900">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/** ─── Password Change Form ─────────────────────────────────────── */

function PasswordChangeForm() {
  const t = useTranslations('page.perfil');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 8) {
      setError(t('password-min-length'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('password-mismatch'));
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('current')) {
        setError('La contraseña actual no es correcta.');
      } else {
        setError(t('password-error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-zinc-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-lg text-zinc-900">{t('password-title')}</CardTitle>
          <p className="mt-1 text-sm text-zinc-500">{t('password-description')}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">{t('password-current')}</Label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl border-zinc-200 bg-zinc-50/60 pl-10 pr-10 shadow-sm transition-colors focus-visible:bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">{t('password-new')}</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl border-zinc-200 bg-zinc-50/60 pl-10 pr-10 shadow-sm transition-colors focus-visible:bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('password-confirm')}</Label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl border-zinc-200 bg-zinc-50/60 pl-10 pr-10 shadow-sm transition-colors focus-visible:bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
              {t('password-success')}
            </p>
          )}

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full h-11 rounded-xl bg-[#040927] font-semibold text-white shadow-lg shadow-[#040927]/20 hover:bg-[#101a4a]"
            disabled={loading}
          >
            {loading ? t('password-saving') : t('password-save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** ─── Main Page ────────────────────────────────────────────────── */

export default function PerfilPage() {
  const t = useTranslations('page.perfil');
  const { user, logout } = useAuth();
  const { activeDestino, canSelectDestino, isLoadingDestino } = useDestino();
  const { profile, isLoading, mutate } = useProfile();
  const { updateProfile, isUpdating } = useUpdateProfile();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [destinationDetails, setDestinationDetails] = useState<Destination | null>(null);
  const [isLoadingDestinationDetails, setIsLoadingDestinationDetails] = useState(false);

  useEffect(() => {
    if (!activeDestino?.id) {
      setDestinationDetails(null);
      setIsLoadingDestinationDetails(false);
      return;
    }

    const activeDestinoId = activeDestino.id;
    let ignore = false;

    async function loadDestinationDetails() {
      setIsLoadingDestinationDetails(true);
      try {
        const destination = await getDestination(activeDestinoId);
        if (!ignore) setDestinationDetails(destination);
      } catch {
        if (!ignore) setDestinationDetails(null);
      } finally {
        if (!ignore) setIsLoadingDestinationDetails(false);
      }
    }

    loadDestinationDetails();

    return () => {
      ignore = true;
    };
  }, [activeDestino?.id]);

  const handleSave = async (data: Record<string, unknown>) => {
    await updateProfile(data);
    await mutate();
  };

  const profileRecord = profile as Record<string, unknown> | null;
  const displayName = getDisplayName(profileRecord, user?.name || user?.email || 'Usuario');
  const displayEmail = getDisplayEmail(profileRecord, user?.email || 'No disponible');
  const displayPhone = getDisplayPhone(profileRecord);
  const displayUserId = getDisplayUserId(profileRecord, user?.id || 'No disponible');
  const roles = (user?.roles?.filter(Boolean).length ? user.roles : getUserRoles()).filter(Boolean);
  const primaryRole = roles[0] || '';
  const roleLabel = primaryRole ? getRoleLabel(primaryRole) : 'Sin rol asignado';
  const destinationRows = getDestinationRows(destinationDetails);
  const capabilityRows = getCapabilityRows(roles, canSelectDestino);

  return (
    <div className="min-h-full bg-gray-50 px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm text-zinc-500">Destino</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-medium text-zinc-900">Mi Perfil</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <section className="rounded-3xl bg-[#040927] px-6 py-7 text-white shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-white/20">
                <AvatarFallback className="bg-white text-xl font-bold text-[#040927]">
                  {getInitial(displayName, displayEmail)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-blue-100">Mi Perfil</p>
                <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
                <p className="mt-1 text-sm text-blue-100">Información de cuenta, alcance y destino activo.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                className="bg-white text-[#040927] hover:bg-blue-50"
                onClick={() => setShowEditProfile(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar datos personales
              </Button>
              <Button
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => void logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </section>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="h-auto gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1">
            <TabsTrigger
              value="perfil"
              className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
            >
              {t('tab-perfil')}
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
            >
              {t('tab-password')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="rounded-2xl border-zinc-200 bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg text-zinc-900">Identidad y cuenta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                  ) : (
                    <DetailList
                      rows={[
                        { label: 'Nombre', value: displayName || 'No disponible' },
                        { label: 'Email', value: displayEmail || 'No disponible' },
                        { label: 'Teléfono', value: displayPhone || 'No disponible' },
                        { label: 'ID de cuenta', value: displayUserId },
                      ]}
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-zinc-200 bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg text-zinc-900">Rol y alcance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-zinc-500">Rol principal</p>
                    <p className="mt-1 text-xl font-semibold text-zinc-900">{roleLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {roles.length > 0 ? roles.map((role) => (
                      <Badge key={role} variant="secondary" className="rounded-full bg-blue-50 text-blue-700">
                        {getRoleLabel(role)}
                      </Badge>
                    )) : (
                      <Badge variant="secondary" className="rounded-full bg-zinc-100 text-zinc-600">Sin rol</Badge>
                    )}
                  </div>
                  <DetailList rows={capabilityRows} />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-zinc-200 bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg text-zinc-900">Destino activo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingDestino ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                      <p className="text-sm text-zinc-500">Destino seleccionado</p>
                      <p className="mt-1 text-2xl font-semibold text-zinc-900">
                        {activeDestino?.name || 'No disponible'}
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">
                        {canSelectDestino
                          ? 'Tu rol permite cambiar el destino activo desde el selector superior.'
                          : 'Tu destino activo depende de la asignación de la cuenta.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-zinc-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-zinc-900">Datos del destino</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingDestino || isLoadingDestinationDetails ? (
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-56" />
                      <Skeleton className="h-5 w-44" />
                      <Skeleton className="h-5 w-64" />
                    </div>
                  ) : !activeDestino ? (
                    <p className="text-sm text-zinc-500">No hay un destino activo seleccionado.</p>
                  ) : destinationRows.length > 0 ? (
                    <DetailList rows={destinationRows} />
                  ) : (
                    <p className="text-sm text-zinc-500">No hay datos adicionales disponibles para el destino activo.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {showEditProfile && (
              <section className="max-w-2xl">
                <UserProfileForm
                  profile={profileRecord}
                  onSave={handleSave}
                  isLoading={isLoading || isUpdating}
                  defaultMode="EDIT"
                  showHeaderEditButton={false}
                  title="Editar datos personales"
                  onCancel={() => setShowEditProfile(false)}
                />
              </section>
            )}
          </TabsContent>

          <TabsContent value="password" className="max-w-lg">
            <PasswordChangeForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
