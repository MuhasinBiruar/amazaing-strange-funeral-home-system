import type { Dispatch, SetStateAction } from 'react';
import type { DateRangeValue, FilterDef } from '../types';
import DateRangePicker from '@/components/dateRangePicker';
import SelectFilter from './selectFilter';

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
            <SelectFilter<F, keyof F>
              key={String(filter.key)}
              value={current}
              options={filter.options}
              onChange={(value) => {
                updateFilter(filter.key, value);
              }}
            />
          );
        }

        if (filter.type === 'dateRange') {
          const current = (values[filter.key] as DateRangeValue) ?? {
            from: null,
            to: null,
          };
          return (
            <DateRangePicker
              key={String(filter.key)}
              value={current}
              placeholder={filter.label}
              onApply={(from, to) =>
                updateFilter(filter.key, { from, to } as F[typeof filter.key])
              }
              onClear={() =>
                updateFilter(filter.key, {
                  from: null,
                  to: null,
                } as F[typeof filter.key])
              }
            />
          );
        }

        console.error(
          'Attempted to render invalid filter in FilterBar',
          filter,
        );
      })}
    </>
  );
}
