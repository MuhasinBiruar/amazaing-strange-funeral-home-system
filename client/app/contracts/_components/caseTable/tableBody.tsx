import { Loader2 } from 'lucide-react';
import SortableHeaderCell from './sortableHeaderCell';
import type { Column, ColumnKey, SortOrder } from './types';
import type { Dispatch, SetStateAction } from 'react';
import type { Case } from 'shared';
import Link from 'next/link';

const COLUMNS: Column[] = [
  { key: 'caseid', label: 'Case ID' },
  { key: 'deceased_name', label: 'Deceased name' },
  { key: 'representative_name', label: 'Representative name' },
  { key: 'burialdatedeadline', label: 'Burial deadline' },
  { key: 'total_pending_docs', label: 'Total pending docs.' },
  { key: 'totalamount', label: 'Total amount' },
  { key: 'deceased_status', label: 'Deceased status' },
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
    <div className="relative overflow-x-auto">
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-[10%]" />
          <col className="w-[19%]" />
          <col className="w-[19%]" />
          <col className="w-[13%]" />
          <col className="w-[10%]" />
          <col className="w-[16%]" />
          <col className="w-[13%]" />
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
                <td className="px-5 py-3 text-gray-800 font-medium whitespace-nowrap">
                  #{c.caseid}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-break-spaces">
                  {/* TODO: Add href for linking deceased_name */}
                  <Link href={`contracts?caseid=${c.caseid}`}>
                    {c.deceased_name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-break-spaces">
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
                <td className="px-5 py-3 text-gray-500 font-medium whitespace-nowrap wrap">
                  {c.deceased_status[0].toUpperCase()}
                  {c.deceased_status.slice(1)}
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
