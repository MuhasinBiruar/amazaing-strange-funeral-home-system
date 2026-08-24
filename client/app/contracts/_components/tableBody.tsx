import { Loader2 } from 'lucide-react';
import SortableHeaderCell from './sortableHeaderCell';
import type { Column, SortableColumnKey, SortDir } from './types';
import type { Dispatch, SetStateAction } from 'react';
import type { ContractSchema } from '@/app/services/contractService';

const COLUMNS: Column[] = [
  { key: 'contractid', label: 'Contract no.', sortable: true },
  { key: 'caseid', label: 'Case ID', sortable: true },
  { key: 'packageid', label: 'Package ID', sortable: true },
  { key: 'signeddate', label: 'Signed date', sortable: true },
  { key: 'burialdatedeadline', label: 'Burial deadline', sortable: true },
  { key: 'embalmingperiod', label: 'Embalming period', sortable: true },
  { key: 'totalamount', label: 'Total amount', sortable: true },
  { key: 'inclusions', label: 'Inclusions', sortable: false },
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
  contracts,
  isLoading,
  errorMsg,
}: {
  sortBy: SortableColumnKey;
  setSortBy: Dispatch<SetStateAction<SortableColumnKey>>;
  sortDir: SortDir;
  setSortDir: Dispatch<SetStateAction<SortDir>>;
  setPage: Dispatch<SetStateAction<number>>;
  contracts: ContractSchema[];
  errorMsg: string | null;
  isLoading: boolean;
}) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-[10%] " />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[13%]" />
          <col className="w-[14%]" />
          <col className="w-[13%]" />
          <col className="w-[12%]" />
          <col className="w-[18%]" />
        </colgroup>

        <thead>
          <tr className="h-10 text-xs text-gray-400 tracking-wide border-b border-gray-100">
            {COLUMNS.map((col) => (
              <SortableHeaderCell
                key={col.key}
                column={col}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={(columnKey) => {
                  if (sortBy === columnKey) {
                    setSortDir((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
                  } else {
                    setSortBy(columnKey);
                    setSortDir('ASC');
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

          {!errorMsg && contracts.length === 0 && (
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
            contracts.map((c) => (
              <tr
                key={c.contractid}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                <td className="px-5 py-3 text-gray-800 font-medium whitespace-nowrap">
                  #{c.contractid}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {c.caseid}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {c.packageid}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {formatDate(c.signeddate)}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {formatDate(c.burialdatedeadline)}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {c.embalmingperiod} days
                </td>
                <td className="px-5 py-3 text-gray-800 font-medium whitespace-nowrap wrap">
                  {formatCurrency(c.totalamount)}
                </td>
                <td className="px-5 py-3 text-gray-500 wrap-normal">
                  {c.inclusions || '—'}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {isLoading && (
        <div className="absolute inset-0 top-10 bottom-0 flex items-center justify-center bg-white/60">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading contracts…
          </div>
        </div>
      )}
    </div>
  );
}
