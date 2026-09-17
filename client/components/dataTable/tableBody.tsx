import { Loader2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import SortableHeaderCell from '@/components/dataTable/sortableHeaderCell';
import type { DataTableColumn, SortOrder } from './types';

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
}) {
  return (
    <div className="overflow-x-auto relative">
      <table className="w-full table-auto text-sm text-center">
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} className={col.widthClassName} />
          ))}
        </colgroup>

        <thead ref={theadRef}>
          <tr className="text-xs text-gray-400 tracking-wide border-b border-gray-100">
            {columns.map((col) => (
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
            ))}
          </tr>
        </thead>
        <tbody>
          {!isLoading && errorMsg && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-sm text-red-500"
              >
                {errorMsg}
              </td>
            </tr>
          )}

          {!errorMsg && rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-sm text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          )}

          {!errorMsg &&
            rows.map((row) => {
              const selected = isRowSelected?.(row) ?? false;

              return (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  aria-selected={onRowClick ? selected : undefined}
                  className={`h-11.25 border-b border-gray-100 last:border-0 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${selected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                >
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
