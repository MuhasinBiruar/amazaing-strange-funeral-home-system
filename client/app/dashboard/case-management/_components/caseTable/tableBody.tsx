import { Loader2 } from 'lucide-react';
import SortableHeaderCell from './sortableHeaderCell';
import type { Column, ColumnKey, SortOrder } from './types';
import type { Dispatch, SetStateAction } from 'react';
import type { Case } from 'shared';

const COLUMNS: Column[] = [
  { key: 'deceased_name', label: 'Deceased name' },
  { key: 'representative_name', label: 'Representative name' },
  { key: 'burialdatedeadline', label: 'Burial deadline' },
  { key: 'total_pending_docs', label: 'Total pending docs.' },
  { key: 'totalamount', label: 'Total amount' },
  { key: 'servicestatus', label: 'Service status' },
  { key: 'datecreated', label: 'Date created' },
  { key: 'managed_by_name', label: 'Manager name' },
];

function formatCurrency(value: unknown) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'PHP' });
}

function formatDate(value: string | number | Date | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TableBody({
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  setPage,
  cases,
  isLoading,
  errorMsg,
}: {
  sortBy: ColumnKey;
  setSortBy: Dispatch<SetStateAction<ColumnKey>>;
  sortDir: SortOrder;
  setSortDir: Dispatch<SetStateAction<SortOrder>>;
  setPage: Dispatch<SetStateAction<number>>;
  cases: Case[];
  errorMsg: string | null;
  isLoading: boolean;
}) {
  return (
    <div className="overflow-x-auto relative">
      <table className="w-full table-auto text-sm text-center">
        <colgroup>
          <col className="w-45" />
          <col className="w-45" />
          <col className="w-35" />
          <col className="w-30" />
          <col className="w-35" />
          <col className="w-32.5" />
          <col className="w-32.5" />
          <col className="w-40" />
        </colgroup>

        <thead>
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

          {!errorMsg && cases.length === 0 && (
            <tr>
              <td
                colSpan={COLUMNS.length}
                className="px-5 py-10 text-center text-sm text-gray-400"
              >
                No contracts match your search.
              </td>
            </tr>
          )}

          {!errorMsg &&
            cases.map((c) => (
              <tr
                key={c.caseid}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                <td className="px-5 py-3 text-gray-500 wrap-break-word">
                  {c.deceased_name}
                </td>
                <td className="px-5 py-3 text-gray-500 wrap-break-word">
                  {c.representative_name}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {formatDate(c.burialdatedeadline)}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {c.total_pending_docs}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {formatCurrency(c.totalamount)}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {c.servicestatus[0].toUpperCase()}
                  {c.servicestatus.slice(1)}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {formatDate(c.datecreated)}
                </td>
                <td className="px-5 py-3 text-gray-500 wrap-break-word">
                  {c.managed_by_name}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {isLoading && (
        <div className="absolute inset-0 top-18 bottom-0 flex items-center justify-center bg-white/80">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}
