'use client';

import { Lock } from 'lucide-react';

interface TipoEvalCardProps {
  tipo: {
    id: string;
    label: string;
    description: string;
    badge?: string;
  };
  selected: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onClick?: () => void;
}

export function TipoEvalCard({
  tipo,
  selected,
  disabled = false,
  disabledReason,
  onClick,
}: TipoEvalCardProps) {
  const cardClasses = [
    'border rounded-[12px] p-4 transition-all select-none',
    disabled && selected
      ? 'border-blue-200 bg-blue-50 cursor-not-allowed opacity-75'
      : disabled
        ? 'border-zinc-100 bg-zinc-50 cursor-not-allowed opacity-60'
        : selected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 cursor-pointer'
          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer',
  ].join(' ');

  const radioDotClasses = [
    'relative w-4 h-4 rounded-full border-2 flex-shrink-0',
    selected
      ? 'border-blue-600 bg-blue-600'
      : disabled
        ? 'border-zinc-200 bg-zinc-100'
        : 'border-zinc-300 bg-white',
  ].join(' ');

  return (
    <div
      className={cardClasses}
      onClick={disabled ? undefined : onClick}
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Row 1: radio + label + badge */}
      <div className="flex items-center gap-2">
        <div className={radioDotClasses}>
          {selected && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-zinc-900 flex-1">{tipo.label}</span>
        {tipo.badge && (
          <span className="text-xs font-medium bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
            {tipo.badge}
          </span>
        )}
      </div>

      {/* Row 2: description */}
      <p className="text-sm text-zinc-500 mt-1 ml-6">{tipo.description}</p>

      {/* Row 3: disabled reason */}
      {disabled && disabledReason && (
        <div className="flex items-center gap-1.5 ml-6 mt-1">
          <Lock size={14} className="text-zinc-400 flex-shrink-0" />
          <span className="text-xs text-zinc-400">{disabledReason}</span>
        </div>
      )}
    </div>
  );
}
