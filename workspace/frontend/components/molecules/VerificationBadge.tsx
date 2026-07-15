'use client';

import React from 'react';

interface VerificationBadgeProps {
  verifiedBy?: string;
  verifiedAt?: string;
  userName: string;
}

/**
 * Green badge showing verification metadata.
 * Displays who verified the indicator and when.
 */
export function VerificationBadge({
  verifiedBy,
  verifiedAt,
  userName,
}: VerificationBadgeProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">
      <p>
        <span className="font-medium">Verificado por:</span>{' '}
        {verifiedBy || userName}
      </p>
      <p>
        <span className="font-medium">Fecha:</span>{' '}
        {verifiedAt
          ? new Date(verifiedAt).toLocaleString('es-ES')
          : new Date().toLocaleString('es-ES')}
      </p>
    </div>
  );
}
