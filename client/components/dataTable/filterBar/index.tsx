import type { Dispatch, SetStateAction } from 'react';
import type { DateRangeValue, FilterDef } from '../types';
import DateRangeFilter from './dateRangeFilter';
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
            <DateRangeFilter
              key={String(filter.key)}
              label={filter.label}
              value={current}
              onChange={(next) =>
                updateFilter(filter.key, next as F[typeof filter.key])
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
