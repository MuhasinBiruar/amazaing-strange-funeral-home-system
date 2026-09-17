'use client';

import { useEffect, useState } from 'react';
import useDebouncedValue from '@/utils/useDebouncedValue';
import useDynamicLimit from '@/utils/useDynamicLimit';
import useElementHeight from '@/utils/useElementHeight';
import TableFooter from './tableFooter';
import TableHeader from './tableHeader';
import TableBody from './tableBody';
import FilterBar from './filterBar';
import type {
  DataTableColumn,
  FetchDataParams,
  FilterDef,
  PaginatedResponse,
  SortOrder,
} from './types';

const SEARCH_DEBOUNCE_MS = 500 as const;
const ROW_HEIGHT_PX = 45 as const;

/**
 * Generic paginated, sortable, searchable, filterable data table.
 *
 * @template T Type of the data to show on the table.
 * @template K Column keys.
 * @template F Filters and their expected type.
 */
export default function DataTable<
  T,
  K extends string,
  F extends Record<string, unknown> = Record<string, never>,
>({
  title,
  countLabel,
  searchPlaceholder = 'Search...',
  filters,
  defaultFilters,
  columns,
  rowKey,
  defaultSortBy,
  defaultSortOrder = 'desc',
  fetchData,
  onRowClick,
  isRowSelected,
  emptyMessage = 'No records found.',
  loadErrorMessage = 'Could not load records. Try again.',
  bodyOffsetClassName,
  refreshKey,
}: {
  title: string;
  /**
   * Formats the header's count label from the total, e.g. `` (t) => `${t} items` ``.
   */
  countLabel: (total: number) => string;
  searchPlaceholder?: string;
  filters?: FilterDef<F>[];
  defaultFilters?: F;
  columns: DataTableColumn<T, K>[];
  rowKey: (row: T) => string | number;
  defaultSortBy: K;
  defaultSortOrder?: SortOrder;
  fetchData: (params: FetchDataParams<K, F>) => Promise<PaginatedResponse<T>>;
  /**
   * Omit for a plain read-only log.
   *
   * @param row Row clicked on.
   */
  onRowClick?: (row: T) => void;
  /**
   * Omit for no stylistic changes when a row is "selected".
   * However you determine that is up to what you write in the function.
   *
   * @param row Row to test if it is selected.
   */
  isRowSelected?: (row: T) => boolean;
  emptyMessage?: string;
  loadErrorMessage?: string;
  bodyOffsetClassName?: string;
  /**
   * Bump to force a refetch (e.g. after a mutation elsewhere invalidates this list).
   */
  refreshKey?: number;
}) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<K>(defaultSortBy);
  const [sortOrder, setSortDir] = useState<SortOrder>(defaultSortOrder);
  const [filterValues, setFilterValues] = useState<F>(
    defaultFilters ?? ({} as F),
  );
  const [page, setPage] = useState(1);

  const [headerWrapRef, headerHeight] = useElementHeight<HTMLDivElement>();
  const [theadRef, theadHeight] = useElementHeight<HTMLTableSectionElement>();
  const [footerWrapRef, footerHeight] = useElementHeight<HTMLDivElement>();

  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dboSearch, commitDboSearch] = useDebouncedValue(
    search,
    SEARCH_DEBOUNCE_MS,
  );

  const chromeHeight = headerHeight + theadHeight + footerHeight;

  const [containerRef, limit] = useDynamicLimit<HTMLDivElement>({
    rowHeight: ROW_HEIGHT_PX,
    chromeHeight,
    outsideChromeSelector: 'footer',
    minLimit: 2,
    maxLimit: 50,
  });

  const [prevDboSearch, setPrevDboSearch] = useState(dboSearch);
  if (dboSearch !== prevDboSearch) {
    setPrevDboSearch(dboSearch);
    setPage(1);
  }

  const [prevLimit, setPrevLimit] = useState(limit);
  if (limit !== prevLimit) {
    setPrevLimit(limit);
    setPage(1);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetchData({
          page,
          limit,
          sortBy,
          sortOrder,
          search: dboSearch,
          filters: filterValues,
          signal: controller.signal,
        });

        setRows(res.data);
        setTotal(res.meta.total);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Failed to load table data:', error);
        setErrorMsg(loadErrorMessage);
        setRows([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    load();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dboSearch, sortBy, sortOrder, page, limit, filterValues, refreshKey]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-gray-200 bg-white overflow-hidden"
    >
      <div ref={headerWrapRef}>
        <TableHeader
          title={title}
          countLabel={countLabel(total)}
          search={search}
          setSearch={setSearch}
          commitDboSearch={commitDboSearch}
          searchPlaceholder={searchPlaceholder}
          filterSlot={
            filters && filters.length > 0 ? (
              <FilterBar
                filters={filters}
                values={filterValues}
                setValues={setFilterValues}
                setPage={setPage}
              />
            ) : undefined
          }
        />
      </div>

      <TableBody
        columns={columns}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDir={sortOrder}
        setSortDir={setSortDir}
        setPage={setPage}
        rows={rows}
        rowKey={rowKey}
        errorMsg={errorMsg}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        theadRef={theadRef}
        onRowClick={onRowClick}
        isRowSelected={isRowSelected}
        bodyOffsetClassName={bodyOffsetClassName}
      />

      <div ref={footerWrapRef}>
        <TableFooter
          page={page}
          setPage={setPage}
          total={total}
          limit={limit}
        />
      </div>
    </div>
  );
}
