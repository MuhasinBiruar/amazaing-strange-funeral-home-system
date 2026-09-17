'use client';

import { Calendar } from 'primereact/calendar';
import type { DateRangeValue } from '../types';

function parseLocalDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateValue(date: Date | null | undefined): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Single popover date-range picker (PrimeReact `Calendar` in range mode),
 * replacing two bare `<input type="date">` fields with one control that
 * shows an actual calendar grid for picking a start/end date.
 *
 * @remarks
 * Dates stay `yyyy-mm-dd` strings at the `DateRangeValue` boundary (parsed
 * as local dates, not UTC, so a `Date` round-trips to the same calendar day
 * regardless of timezone) — only this component talks to PrimeReact's `Date`
 * objects.
 */
export default function DateRangeFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}) {
  const from = parseLocalDate(value.from);
  const to = parseLocalDate(value.to);
  const dates: Date[] | null = from ? (to ? [from, to] : [from]) : null;

  return (
    <div className="flex items-center gap-1.5">
      <Calendar
        value={dates}
        onChange={(ev) => {
          const picked = (ev.value as (Date | null)[] | null) ?? [];
          const [nextFrom, nextTo] = picked;
          onChange({ from: toDateValue(nextFrom), to: toDateValue(nextTo) });
        }}
        selectionMode="range"
        dateFormat="M d, yy"
        placeholder={label}
        readOnlyInput
        hideOnRangeSelection
        showButtonBar
        inputClassName="text-sm! border! border-gray-200! rounded-md! px-2.5! \
        py-1.5! text-gray-700! focus:outline-none! focus:ring-1 \
        focus:ring-indigo-400! focus:border-indigo-400! cursor-pointer! w-40! \
        sm:w-48! placeholder:text-gray-400! hover:border-indigo-400!"
      />
    </div>
  );
}
