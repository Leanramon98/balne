'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { IndicatorCriteria } from '@/types';

interface SumaSelectProps {
  value: string;
  criteria: IndicatorCriteria[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Multi-checkbox component for "suma" type indicators.
 *
 * Each criteria item shows a checkbox with its percentage contribution.
 * The total is auto-calculated as the sum of all checked items.
 * Items with value=0 ("ninguna de las anteriores") are automatic
 * when nothing else is checked.
 *
 * Uses internal state for checked items to avoid ambiguity when
 * multiple criteria share the same percentage value (e.g. two 25% items).
 * The parent MUST pass a `key` that changes on navigation (e.g. indicatorId)
 * so the component remounts fresh when navigating between indicators.
 */
export function SumaSelect({ value, criteria, onChange, disabled = false }: SumaSelectProps) {
  // Exclude the 0% "ninguna" item from the selectable list
  const selectableItems = criteria.filter((c) => (c.value ?? 0) > 0);
  const noneItem = criteria.find((c) => (c.value ?? 0) === 0);
  const isNone = noneItem != null;

  // Internal state: which indices are checked
  // Initialized once from the value prop. Parent controls navigation via `key`.
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(() => initChecked(value, selectableItems));

  const currentTotal = parseInt(value) || 0;
  const isNoneSelected = currentTotal === 0 || checkedIndices.size === 0;

  const handleToggle = (index: number) => {
    const next = new Set(checkedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setCheckedIndices(next);

    const total = next.size === 0
      ? 0
      : Array.from(next)
          .map((i) => selectableItems[i]?.value ?? 0)
          .reduce((sum, v) => sum + v, 0);

    onChange(String(total));
  };

  const handleNoneToggle = () => {
    if (isNoneSelected) {
      // Uncheck "none" → check all selectable items
      const allSet = new Set(selectableItems.map((_, i) => i));
      setCheckedIndices(allSet);
      const total = selectableItems
        .map((c) => c.value ?? 0)
        .reduce((sum, v) => sum + v, 0);
      onChange(String(total));
    } else {
      // Check "none" → uncheck all
      setCheckedIndices(new Set());
      onChange('0');
    }
  };

  return (
    <div className="space-y-2">
      {selectableItems.length === 0 && (
        <p className="text-sm text-zinc-400">Sin criterios definidos</p>
      )}

      {selectableItems.map((item, idx) => {
        const isChecked = checkedIndices.has(idx);
        const pct = item.value ?? 0;
        const desc = item.description || `Criterio ${idx + 1}`;

        return (
          <label
            key={idx}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
              !disabled && 'hover:border-blue-300 hover:bg-blue-50/30'
            } ${
              isChecked
                ? 'border-blue-200 bg-blue-50'
                : 'border-zinc-200 bg-white'
            } ${disabled ? 'opacity-70' : ''}`}
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => handleToggle(idx)}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex shrink-0 items-center justify-center rounded-lg bg-[#040927] px-2 py-0.5 text-xs font-bold text-white min-w-[2.5rem] text-center">
              {pct}%
            </div>
            <span className="text-sm leading-relaxed text-zinc-700">
              {desc}
            </span>
          </label>
        );
      })}

      {/* "None" item (value=0) */}
      {isNone && (
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
            !disabled && 'hover:border-zinc-300'
          } ${
            isNoneSelected
              ? 'border-zinc-300 bg-zinc-100'
              : 'border-zinc-200 bg-white'
          } ${disabled ? 'opacity-70' : ''}`}
        >
          <Checkbox
            checked={isNoneSelected}
            onCheckedChange={() => handleNoneToggle()}
            disabled={disabled}
            className="mt-0.5"
          />
          <div className="flex shrink-0 items-center justify-center rounded-lg bg-zinc-400 px-2 py-0.5 text-xs font-bold text-white min-w-[2.5rem] text-center">
            0%
          </div>
          <span className="text-sm leading-relaxed text-zinc-500">
            {noneItem?.description || 'Ninguna de las anteriores'}
          </span>
        </label>
      )}

      {/* Total display */}
      <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
        <span className="text-sm font-medium text-emerald-800">Total</span>
        <span className="text-lg font-bold text-emerald-700">
          {isNoneSelected ? '0' : currentTotal}%
        </span>
      </div>
    </div>
  );
}

/**
 * Initialize the checked set from a total value.
 * Uses greedy matching: picks items from highest value to lowest
 * that fit within the total. Only used on mount and when value
 * changes externally.
 */
function initChecked(value: string, items: IndicatorCriteria[]): Set<number> {
  const total = parseInt(value) || 0;
  const checked = new Set<number>();
  if (total <= 0) return checked;

  // Sort by value descending, index ascending for deterministic behavior
  const sorted = items
      .map((c, i) => ({ index: i, value: c.value ?? 0 }))
      .sort((a, b) => b.value - a.value || a.index - b.index);

  let remaining = total;
  for (const item of sorted) {
    if (item.value <= remaining && item.value > 0) {
      checked.add(item.index);
      remaining -= item.value;
    }
  }
  return checked;
}
