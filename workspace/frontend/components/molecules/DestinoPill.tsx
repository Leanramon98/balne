'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown } from 'lucide-react';
import { useDestino } from '@/context/destino-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';

interface DestinoPillProps {
  destinoName?: string;
}

export function DestinoPill({ destinoName }: DestinoPillProps) {
  const router = useRouter();
  const { activeDestino, setActiveDestino, availableDestinos, canSelectDestino, isLoadingDestino } =
    useDestino();
  const [open, setOpen] = useState(false);

  const displayName =
    destinoName ?? activeDestino?.name ?? (canSelectDestino ? 'Seleccioná un destino' : 'Sin seleccionar');
  const isPlaceholder = !destinoName && !activeDestino;

  if (isLoadingDestino) {
    return <Skeleton className="h-[42px] min-w-[180px] lg:min-w-[248px] rounded-[10px]" />;
  }

  const pillContent = (
    <>
      <MapPin className="shrink-0 text-zinc-500" size={16} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-400 font-medium leading-none">Destino</p>
        <p
          className={[
            'text-sm font-semibold leading-none mt-0.5 truncate',
            isPlaceholder ? 'text-zinc-400' : 'text-zinc-900',
          ].join(' ')}
        >
          {displayName}
        </p>
      </div>
      {canSelectDestino && (
        <ChevronDown className="shrink-0 text-zinc-400 ml-auto" size={14} />
      )}
    </>
  );

  const pillClass =
    'inline-flex items-center gap-2 border border-zinc-200 rounded-[10px] px-3 py-2 min-w-0 w-full lg:min-w-[248px] lg:w-auto bg-white text-left';

  if (!canSelectDestino) {
    return <div className={`${pillClass} cursor-default`}>{pillContent}</div>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`${pillClass} cursor-pointer hover:bg-zinc-50`}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {pillContent}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar destino..." />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            {availableDestinos.map((d) => (
              <CommandItem
                key={d.id}
                value={d.name}
                onSelect={() => {
                  setActiveDestino({ id: d.id, name: d.name });
                  setOpen(false);
                  router.push('/');
                }}
              >
                {d.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
