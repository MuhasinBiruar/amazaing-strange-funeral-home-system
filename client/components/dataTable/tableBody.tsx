import { Loader2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import SortableHeaderCell from '@/components/dataTable/sortableHeaderCell';
import type { DataTableColumn } from './types';
import type { SortOrder } from 'shared/utils';

/** Checkbox selection of rows on the current page. */
export interface RowSelection<T> {
  isSelected: (row: T) => boolean;
  toggle: (row: T) => void;
  /** Whether none, some, or all rows on the page are ticked. */
  pageState: 'none' | 'some' | 'all';
  togglePage: () => void;
}

const checkboxClassName =
  'size-4 rounded border-gray-300 accent-indigo-600 cursor-pointer align-middle';

export default function TableBody<T, K extends string>({
  columns,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  setPage,
  rows,
  rowKey,
  isLoading,
  errorMsg,
  emptyMessage = 'No records found.',
  theadRef,
  onRowClick,
  isRowSelected,
  bodyOffsetClassName = 'top-17.25',
  selection,
}: {
  columns: DataTableColumn<T, K>[];
  sortBy: K;
  setSortBy: Dispatch<SetStateAction<K>>;
  sortDir: SortOrder;
  setSortDir: Dispatch<SetStateAction<SortOrder>>;
  setPage: Dispatch<SetStateAction<number>>;
  rows: T[];
  rowKey: (row: T) => string | number;
  errorMsg: string | null;
  isLoading: boolean;
  emptyMessage?: string;
  theadRef?: (node: HTMLTableSectionElement | null) => void;
  onRowClick?: (row: T) => void;
  isRowSelected?: (row: T) => boolean;
  bodyOffsetClassName?: string;
  /** Adds a leading checkbox column. */
  selection?: RowSelection<T>;
}) {
  const columnCount = columns.length + (selection ? 1 : 0);

  return (
    <div className="overflow-x-auto relative">
      <table className="w-full table-auto text-sm text-center">
        <colgroup>
          {selection && <col className="w-12" />}
          {columns.map((col) => (
            <col key={col.key} className={col.widthClassName} />
          ))}
        </colgroup>

        <thead ref={theadRef}>
          <tr className="text-xs text-gray-400 tracking-wide border-b border-gray-100">
            {selection && (
              <th className="pl-5 pr-1 py-2.5 h-12">
                <input
                  type="checkbox"
                  aria-label="Select all rows on this page"
                  checked={selection.pageState === 'all'}
                  ref={(node) => {
                    if (node)
                      node.indeterminate = selection.pageState === 'some';
                  }}
                  onChange={selection.togglePage}
                  disabled={rows.length === 0}
                  className={checkboxClassName}
                />
              </th>
            )}
            {columns.map((col) =>
              col.sortable === false ? (
                <th
                  key={col.key}
                  className="px-5 py-2.5 font-medium text-center h-12 uppercase"
                >
                  {col.label}
                </th>
              ) : (
                <SortableHeaderCell
                  key={col.key}
                  column={col}
                  sortBy={sortBy}
                  sortOrder={sortDir}
                  onSort={(columnKey) => {
                    if (sortBy === columnKey) {
                      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                    } else {
                      setSortBy(columnKey);
                      setSortDir('asc');
                    }
                    setPage(1);
                  }}
                />
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {!isLoading && errorMsg && (
            <tr>
              <td
                colSpan={columnCount}
                className="px-5 py-10 text-center text-sm text-red-500"
              >
                {errorMsg}
              </td>
            </tr>
          )}

          {!errorMsg && rows.length === 0 && (
            <tr>
              <td
                colSpan={columnCount}
                className="px-5 py-10 text-center text-sm text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          )}

          {!errorMsg &&
            rows.map((row) => {
              const selected = isRowSelected?.(row) ?? false;
              const ticked = selection?.isSelected(row) ?? false;

              return (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  aria-selected={onRowClick ? selected : undefined}
                  className={`h-11.25 border-b border-gray-100 last:border-0 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${selected || ticked ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                >
                  {selection && (
                    // Ticking a row mustn't also open it via onRowClick.
                    <td
                      className="pl-5 pr-1 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={ticked}
                        onChange={() => selection.toggle(row)}
                        className={checkboxClassName}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={
                        col.cellClassName ??
                        'px-5 py-3 text-gray-500 whitespace-nowrap'
                      }
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
        </tbody>
      </table>

      {isLoading && (
        <div
          className={`absolute inset-0 ${bodyOffsetClassName} bottom-0 flex items-center justify-center bg-white/80`}
        >
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}
