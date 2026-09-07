import { Loader2 } from 'lucide-react';
import SortableHeaderCell from '../../table/sortableHeaderCell';
import { formatDate, titleCase } from '../../table/format';
import type { Column, ColumnKey, SortOrder } from './types';
import type { Dispatch, SetStateAction } from 'react';
import type { UncontractedDeceased } from 'shared';

const COLUMNS: Column[] = [
  { key: 'caseid', label: 'Case #' },
  { key: 'deceased_name', label: 'Deceased name' },
  { key: 'representative_name', label: 'Representative name' },
  { key: 'servicestatus', label: 'Service status' },
  { key: 'plantype', label: 'Plan type' },
  { key: 'datecreated', label: 'Date created' },
  { key: 'managed_by_name', label: 'Manager name' },
];

export default function TableBody({
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  setPage,
  records,
  isLoading,
  errorMsg,
  theadRef,
  selectedCaseId,
  onSelect,
}: {
  sortBy: ColumnKey;
  setSortBy: Dispatch<SetStateAction<ColumnKey>>;
  sortDir: SortOrder;
  setSortDir: Dispatch<SetStateAction<SortOrder>>;
  setPage: Dispatch<SetStateAction<number>>;
  records: UncontractedDeceased[];
  errorMsg: string | null;
  isLoading: boolean;
  theadRef?: (node: HTMLTableSectionElement | null) => void;
  selectedCaseId: number | null;
  onSelect: (record: UncontractedDeceased) => void;
}) {
  return (
    <div className="overflow-x-auto relative">
      <table className="w-full table-auto text-sm text-center">
        <colgroup>
          <col className="w-20" />
          <col className="w-45" />
          <col className="w-45" />
          <col className="w-32.5" />
          <col className="w-27.5" />
          <col className="w-32.5" />
          <col className="w-40" />
        </colgroup>

        <thead ref={theadRef}>
          <tr className="text-xs text-gray-400 tracking-wide border-b border-gray-100">
            {COLUMNS.map((col) => (
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
                colSpan={COLUMNS.length}
                className="px-5 py-10 text-center text-sm text-red-500"
              >
                {errorMsg}
              </td>
            </tr>
          )}

          {!errorMsg && !isLoading && records.length === 0 && (
            <tr>
              <td
                colSpan={COLUMNS.length}
                className="px-5 py-10 text-center text-sm text-gray-400"
              >
                No deceased records are waiting for a contract.
              </td>
            </tr>
          )}

          {!errorMsg &&
            records.map((r) => {
              const isSelected = selectedCaseId === r.caseid;

              return (
                <tr
                  key={r.caseid}
                  onClick={() => onSelect(r)}
                  aria-selected={isSelected}
                  className={`h-11.25 border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {r.caseid}
                  </td>
                  <td className="px-5 py-3 text-gray-500 wrap-break-word">
                    {r.deceased_name}
                  </td>
                  <td className="px-5 py-3 text-gray-500 wrap-break-word">
                    {r.representative_name || '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {titleCase(r.servicestatus)}
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {r.plantype}
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(r.datecreated)}
                  </td>
                  <td className="px-5 py-3 text-gray-500 wrap-break-word">
                    {r.managed_by_name || '—'}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {isLoading && (
        <div className="absolute inset-0 top-17.25 bottom-0 flex items-center justify-center bg-white/80">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}
