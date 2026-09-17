import type { PaginationQuery, PaginationResponse } from 'shared/utils';
import type { ReactNode } from 'react';

export type SortOrder = 'asc' | 'desc';

export interface PaginatedResponse<T> extends PaginationResponse {
  data: T[];
}

export interface FetchDataParams<K extends string, F> extends PaginationQuery {
  sortBy: K;
  sortOrder: SortOrder;
  search?: string;
  /** Current value of every filter defined for this table. */
  filters: F;
  signal?: AbortSignal;
}

export interface DataTableColumn<T, K extends string = string> {
  key: K;
  label: string;
  /** Tailwind width class for this column's <col>, e.g. "w-45". */
  widthClassName?: string;
  /** Overrides the default `px-5 py-3 text-gray-500 whitespace-nowrap`. */
  cellClassName?: string;
  render: (row: T) => ReactNode;
}

export interface SelectFilterOption<V> {
  label: string;
  value: V;
}

export interface SelectFilterDef<F, K extends keyof F> {
  type: 'select';
  key: K;
  options: SelectFilterOption<F[K]>[];
}

/** An inclusive `[from, to]` range of `yyyy-mm-dd` strings, either end optional. */
export interface DateRangeValue {
  from: string | null;
  to: string | null;
}

export interface DateRangeFilterDef<F, K extends keyof F> {
  type: 'dateRange';
  key: K;
  label: string;
}

export type FilterDef<F> = {
  [K in keyof F]: SelectFilterDef<F, K> | DateRangeFilterDef<F, K>;
}[keyof F];
