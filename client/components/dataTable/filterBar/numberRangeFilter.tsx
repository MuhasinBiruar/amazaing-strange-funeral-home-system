import { useState } from 'react';
import { X } from 'lucide-react';
import type { NumberRangeValue } from '../types';

const toText = (n: number | null) => (n === null ? '' : String(n));

function parse(text: string): number | null {
  const n = Number(text.replace(/,/g, '').trim());
  return text.trim() === '' || !Number.isFinite(n) || n < 0 ? null : n;
}

/**
 * Min/max inputs for a numeric range. Commits on Enter or blur; a reversed
 * range (min > max) is swapped rather than rejected.
 */
export default function NumberRangeFilter({
  label,
  prefix,
  value,
  onChange,
}: {
  label: string;
  prefix?: string;
  value: NumberRangeValue;
  onChange: (value: NumberRangeValue) => void;
}) {
  const [min, setMin] = useState(toText(value.min));
  const [max, setMax] = useState(toText(value.max));

  // Follow outside changes to the applied value (e.g. Clear).
  const [applied, setApplied] = useState(value);
  if (applied.min !== value.min || applied.max !== value.max) {
    setApplied(value);
    setMin(toText(value.min));
    setMax(toText(value.max));
  }

  function commit() {
    let lo = parse(min);
    let hi = parse(max);
    if (lo !== null && hi !== null && lo > hi) [lo, hi] = [hi, lo];
    setMin(toText(lo));
    setMax(toText(hi));
    if (lo !== value.min || hi !== value.max) onChange({ min: lo, max: hi });
  }

  const inputClass =
    'w-20 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
  const isSet = value.min !== null || value.max !== null;

  return (
    <div
      role="group"
      aria-label={`${label} range`}
      // Commit when focus leaves the whole group, not when moving min -> max,
      // so a half-typed range isn't swapped while it's being edited.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) commit();
      }}
      className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-500 hover:border-indigo-400 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400"
    >
      <span className="text-gray-500">{label}</span>
      {prefix && <span className="text-gray-400">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        min={0}
        aria-label={`Minimum ${label.toLowerCase()}`}
        placeholder="Min"
        value={min}
        onChange={(e) => setMin(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          commit();
        }}
        className={inputClass}
      />
      <span className="text-gray-300">–</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        aria-label={`Maximum ${label.toLowerCase()}`}
        placeholder="Max"
        value={max}
        onChange={(e) => setMax(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          commit();
        }}
        className={inputClass}
      />
      {isSet && (
        <button
          type="button"
          onClick={() => onChange({ min: null, max: null })}
          aria-label={`Clear ${label.toLowerCase()} range`}
          className="text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
