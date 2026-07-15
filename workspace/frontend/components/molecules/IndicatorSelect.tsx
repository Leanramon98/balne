'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import useSWR from 'swr';
import { useLocale, useTranslations } from 'next-intl';
import { getAdminIndicators } from '@/sdk/api/evaluations-api';
import { getIndicatorName } from '@/lib/indicator-translations';
import { cn } from '@/lib/utils';
import type { Indicator } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface IndicatorSelectProps {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  /** Called with the full indicator object when a selection is made */
  onIndicatorSelect?: (indicator: Indicator) => void;
}

/**
 * Searchable indicator selector backed by getAdminIndicators().
 * Uses shadcn Command + Popover with debounced client-side filtering
 * on indicator_name and indicator_code.
 */
export function IndicatorSelect({
  value,
  onChange,
  placeholder,
  onIndicatorSelect,
}: IndicatorSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ct = useTranslations('common');
  const t = useTranslations('evaluation');
  const locale = useLocale();

  const { data: indicators } = useSWR('admin-indicators', () => getAdminIndicators());

  const selected = indicators?.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full h-auto min-h-10 justify-between py-2"
        >
          <span className="text-left whitespace-normal break-words">
            {selected
            ? `${getIndicatorName(selected.code, locale, selected.name)} (${selected.code})`
            : placeholder ?? t('indicators.select-placeholder')}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" side="bottom">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('indicators.search-placeholder')}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{ct('no-results')}</CommandEmpty>
            <CommandGroup>
              {indicators
                ?.filter(
                  (i) =>
                    !search ||
                    i.name.toLowerCase().includes(search.toLowerCase()) ||
                    i.code.toLowerCase().includes(search.toLowerCase()),
                )
                .map((indicator) => (
                  <CommandItem
                    key={indicator.id}
                    value={indicator.id}
                    onSelect={(currentValue) => {
                      onChange(currentValue);
                      const match = indicators?.find((i) => i.id === currentValue);
                      if (match) onIndicatorSelect?.(match);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="h-auto py-2"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0 self-start mt-0.5',
                        value === indicator.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="whitespace-normal break-words">
                      {getIndicatorName(indicator.code, locale, indicator.name)} ({indicator.code})
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
