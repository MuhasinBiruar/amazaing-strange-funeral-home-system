import type { SelectFilterDef } from '../types';

export default function SelectFilter<
  F extends Record<string, unknown>,
  K extends keyof F,
>({
  value,
  options,
  onChange,
}: {
  value: F[K];
  options: SelectFilterDef<F, K>['options'];
  onChange: (value: F[K]) => void;
}) {
  return (
    <select
      value={value == null ? '' : String(value)}
      onChange={(e) => {
        const opt = options.find(
          (o) => (o.value == null ? '' : String(o.value)) === e.target.value,
        );

        if (opt !== undefined) onChange(opt.value);
      }}
      className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 \
      text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 \
      focus:border-indigo-400 cursor-pointer hover:border-indigo-400"
    >
      {options.map((opt) => (
        <option
          key={opt.label}
          value={opt.value == null ? '' : String(opt.value)}
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
}
