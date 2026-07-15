'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Edit3, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { changePassword } from '@/sdk/api/users-api';

/**
 * Flexible profile data interface that handles different backend conventions.
 * Backend may return PascalCase (UserProfile from users-service) or camelCase.
 */
export interface ProfileData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  fullName?: string;
  telefono?: string;
  [key: string]: unknown;
}

const PROFILE_FORM_MODE = {
  VIEW: 'VIEW',
  EDIT: 'EDIT',
} as const;

type ProfileFormMode = (typeof PROFILE_FORM_MODE)[keyof typeof PROFILE_FORM_MODE];

interface UserProfileFormProps {
  profile: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  isLoading: boolean;
  defaultMode?: ProfileFormMode;
  showHeaderEditButton?: boolean;
  title?: string;
  onCancel?: () => void;
}

/** Extract display name from any profile shape */
function getDisplayName(p: Record<string, unknown>): string {
  return String(
    p?.fullName ?? p?.FullName ?? p?.full_name ?? p?.name ?? p?.Name ?? p?.email ?? p?.Email ?? '',
  );
}

/** Extract display email from any profile shape */
function getDisplayEmail(p: Record<string, unknown>): string {
  return String(p?.email ?? p?.Email ?? '');
}

/** Extract display phone from any profile shape */
function getDisplayPhone(p: Record<string, unknown>): string {
  return String(p?.phone ?? p?.Phone ?? p?.telefono ?? p?.Telefono ?? '');
}

export function UserProfileForm({
  profile,
  onSave,
  isLoading,
  defaultMode = PROFILE_FORM_MODE.VIEW,
  showHeaderEditButton = true,
  title = 'Mi Perfil',
  onCancel,
}: UserProfileFormProps) {
  const [mode, setMode] = useState<ProfileFormMode>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sync profile data when it loads or changes
  useEffect(() => {
    if (profile) {
      setName(getDisplayName(profile));
      setEmail(getDisplayEmail(profile));
      setPhone(getDisplayPhone(profile));
    }
  }, [profile]);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleEdit = () => {
    if (profile) {
      setName(getDisplayName(profile));
      setEmail(getDisplayEmail(profile));
      setPhone(getDisplayPhone(profile));
    }
    setShowPasswordSection(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    setMode(PROFILE_FORM_MODE.EDIT);
  };

  const handleCancel = () => {
    setMode(PROFILE_FORM_MODE.VIEW);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onCancel?.();
  };

  const handleSave = async () => {
    setError('');

    // Validate passwords match if changing
    if (showPasswordSection && newPassword) {
      if (!currentPassword) {
        setError('Ingresá tu contraseña actual para confirmar el cambio');
        return;
      }
      if (newPassword.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Save profile fields (name, email, phone) via the existing profile endpoint.
      const data: Record<string, unknown> = {
        full_name: name,
      };
      if (email) data.email = email;
      if (phone) data.phone = phone;
      await onSave(data);

      // 2. If the user opted to change password, hit the dedicated change-password
      //    endpoint which requires the current password for safety.
      if (showPasswordSection && newPassword && currentPassword) {
        await changePassword(currentPassword, newPassword);
        // Clear password fields on success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      }

      setSuccess(true);
      setMode(PROFILE_FORM_MODE.VIEW);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-5 w-36" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No se pudo cargar la información del perfil.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {showHeaderEditButton && mode === PROFILE_FORM_MODE.VIEW && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit3 className="mr-2 h-4 w-4" />Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Perfil actualizado correctamente.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {mode === PROFILE_FORM_MODE.VIEW ? (
          // ========== VIEW MODE ==========
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500">Nombre</Label>
              <p className="text-sm font-medium mt-0.5">{getDisplayName(profile)}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Email</Label>
              <p className="text-sm font-medium mt-0.5">{getDisplayEmail(profile)}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Teléfono</Label>
              <p className="text-sm font-medium mt-0.5">
                {getDisplayPhone(profile) || <span className="text-gray-400 italic">No registrado</span>}
              </p>
            </div>
          </div>
        ) : (
          // ========== EDIT MODE ==========
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pf-name">Nombre</Label>
              <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-email">Email</Label>
              <Input id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-phone">Teléfono</Label>
              <Input id="pf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 1234-5678" />
            </div>

            <Separator />

            {/* Password change toggle */}
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-blue-600"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              {showPasswordSection ? '- Ocultar cambio de contraseña' : '+ Cambiar contraseña'}
            </Button>

            {showPasswordSection && (
              <div className="space-y-4 pl-2 border-l-2 border-blue-100">
                <div className="space-y-2">
                  <Label htmlFor="pf-current-pw">Contraseña actual</Label>
                  <Input
                    id="pf-current-pw"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Tu contraseña actual"
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf-new-pw">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="pf-new-pw"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf-confirm-pw">Confirmar contraseña</Label>
                  <Input
                    id="pf-confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetir contraseña"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
