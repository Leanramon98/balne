'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ClipboardList } from 'lucide-react';
import { useDestino } from '@/context/destino-context';
import { useEvaluations } from '@/sdk/hooks/useEvaluations';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';

const EVALUATION_PICKER_PAGE_SIZE = 500;

export function EvaluationPill() {
  const { activeDestino, activeEvaluation, setActiveEvaluation } = useDestino();
  const [open, setOpen] = useState(false);
  const { evaluations, isLoading } = useEvaluations({
    destination_id: activeDestino?.id,
    pageSize: EVALUATION_PICKER_PAGE_SIZE,
    enabled: Boolean(activeDestino),
  });

  useEffect(() => {
    if (!activeEvaluation) return;
    const stillExists = evaluations.some((evaluation) => evaluation.id === activeEvaluation.id);
    if (!isLoading && activeDestino && !stillExists) {
      setActiveEvaluation(null);
    }
  }, [activeDestino, activeEvaluation, evaluations, isLoading, setActiveEvaluation]);

  if (activeDestino && isLoading) {
    return <Skeleton className="h-[42px] min-w-[248px] rounded-[10px]" />;
  }

  const hasEvaluations = evaluations.length > 0;
  const canSelectEvaluation = Boolean(activeDestino) && hasEvaluations;
  const displayName = activeEvaluation?.name
    ?? (activeDestino ? 'Seleccioná una evaluación' : 'Seleccioná un destino');
  const isPlaceholder = !activeEvaluation;

  const pillContent = (
    <>
      <ClipboardList className="shrink-0 text-zinc-500" size={16} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-400 font-medium leading-none">Evaluación</p>
	        <p
	          className={[
	            'text-sm font-semibold leading-none mt-0.5 truncate',
	            isPlaceholder ? 'text-zinc-400' : 'text-zinc-900',
	          ].join(' ')}
	        >
          {activeDestino && !hasEvaluations ? 'Sin evaluaciones' : displayName}
        </p>
      </div>
      {canSelectEvaluation && (
        <ChevronDown className="shrink-0 text-zinc-400 ml-auto" size={14} />
      )}
    </>
  );

  const pillClass =
    'inline-flex items-center gap-2 border border-zinc-200 rounded-[10px] px-3 py-2 min-w-[248px] bg-white text-left';

  if (!canSelectEvaluation) {
    return <div className={`${pillClass} cursor-default opacity-75`}>{pillContent}</div>;
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
          <CommandInput placeholder="Buscar evaluación..." />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            {evaluations.map((evaluation) => (
              <CommandItem
                key={evaluation.id}
                value={evaluation.name}
                onSelect={() => {
                  setActiveEvaluation({
                    id: evaluation.id,
                    name: evaluation.name,
                    destinationId: evaluation.destination_id,
                  });
                  setOpen(false);
                }}
              >
                {evaluation.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
