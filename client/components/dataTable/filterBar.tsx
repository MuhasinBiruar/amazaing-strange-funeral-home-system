import type { Dispatch, SetStateAction } from 'react';
import type { DateRangeValue, FilterDef } from './types';

export default function FilterBar<F extends Record<string, unknown>>({
  filters,
  values,
  setValues,
  setPage,
}: {
  filters: FilterDef<F>[];
  values: F;
  setValues: Dispatch<SetStateAction<F>>;
  setPage: Dispatch<SetStateAction<number>>;
}) {
  function updateFilter<K extends keyof F>(key: K, value: F[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  return (
    <>
      {filters.map((filter) => {
        if (filter.type === 'select') {
          const current = values[filter.key];
          return (
            <select
              key={String(filter.key)}
              value={current == null ? '' : String(current)}
              onChange={(e) => {
                const raw = e.target.value;
                const opt = filter.options.find(
                  (o) => (o.value == null ? '' : String(o.value)) === raw,
                );
                updateFilter(
                  filter.key,
                  (opt?.value ?? null) as F[typeof filter.key],
                );
              }}
              className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 cursor-pointer"
            >
              {filter.options.map((opt) => (
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

        // filter.type === 'dateRange'
        const current = (values[filter.key] as DateRangeValue) ?? {
          from: null,
          to: null,
        };
        return (
          <div key={String(filter.key)} className="flex items-center gap-1">
            <span className="text-xs text-gray-400 hidden sm:inline">
              {filter.label}
            </span>
            <input
              type="date"
              value={current.from ?? ''}
              onChange={(e) =>
                updateFilter(filter.key, {
                  ...current,
                  from: e.target.value || null,
                } as F[typeof filter.key])
              }
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
            />
            <span className="text-xs text-gray-400">–</span>
            <input
              type="date"
              value={current.to ?? ''}
              onChange={(e) =>
                updateFilter(filter.key, {
                  ...current,
                  to: e.target.value || null,
                } as F[typeof filter.key])
              }
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>
        );
      })}
    </>
  );
}
