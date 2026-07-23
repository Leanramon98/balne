'use client';

import React from 'react';
import { useProfile, useUpdateProfile } from '@/sdk/hooks/useProfile';
import { UserProfileForm } from '@/components/organisms/UserProfileForm';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { profile, isLoading, mutate } = useProfile();
  const { updateProfile, isUpdating } = useUpdateProfile();

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      // data holds { full_name, email, phone }
      await updateProfile(data as any);
      toast.success('Perfil actualizado correctamente');
      mutate();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error al guardar cambios';
      toast.error(errMsg);
      throw err;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-content-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-slate-500">Gestioná tu información personal, correo de contacto y contraseña.</p>
      </div>

      <UserProfileForm
        profile={profile}
        onSave={handleSave}
        isLoading={isLoading || isUpdating}
        title="Configuración de Cuenta"
      />
    </div>
  );
}
