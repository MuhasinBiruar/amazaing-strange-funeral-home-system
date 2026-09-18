'use client';

import { useState } from 'react';
import DataTable from '@/components/dataTable';
import { formatCurrency } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getDirectPlans, type DirectPlan } from '@/services/financialService';

type ColumnKey = keyof DirectPlan;

/**
 * Direct payment plans log.
 *
 * @remarks
 * "History" opens a placeholder modal — the transaction-history endpoint
 * isn't built yet, so this just reserves the interaction pattern.
 */
export default function DirectTable() {
  const [historyFor, setHistoryFor] = useState<DirectPlan | null>(null);

  const columns: DataTableColumn<DirectPlan, ColumnKey>[] = [
    {
      key: 'deceased_name',
      label: 'Deceased name',
      widthClassName: 'w-45',
      cellClassName: 'px-5 py-3 wrap-break-word',
      render: (d) => d.deceased_name,
    },
    {
      key: 'representative_name',
      label: 'Representative name',
      widthClassName: 'w-45',
      cellClassName: 'px-5 py-3 text-gray-500 wrap-break-word',
      render: (d) => d.representative_name ?? '—',
    },
    {
      key: 'totalamount',
      label: 'Total amount',
      widthClassName: 'w-32.5',
      render: (d) => (d.totalamount != null ? formatCurrency(d.totalamount) : '—'),
    },
    {
      key: 'totalamountpaid',
      label: 'Total amount paid',
      widthClassName: 'w-32.5',
      render: (d) => formatCurrency(d.totalamountpaid),
    },
    {
      key: 'caseid',
      label: 'History',
      widthClassName: 'w-25',
      render: (d) => (
        <button
          type="button"
          onClick={() => setHistoryFor(d)}
          className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer text-sm"
        >
          View history
        </button>
      ),
    },
  ];

  return (
    <>
      <DataTable<DirectPlan, ColumnKey>
        title="Direct payment log"
        countLabel={(total) => `${total} plans`}
        searchPlaceholder="Search by deceased or representative..."
        columns={columns}
        rowKey={(d) => d.caseid}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters: _filters, ...params }) => getDirectPlans(params)}
        emptyMessage="No direct payment plans match your search."
        loadErrorMessage="Could not load direct payment plans. Try again."
      />

      {/* Placeholder — transaction-history endpoint not built yet */}
      {historyFor && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setHistoryFor(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-900">
              Transaction history — {historyFor.deceased_name}
            </h3>
            <p className="text-sm text-gray-500">
              Placeholder: transaction history endpoint isn't available yet.
              This will show a chronological list of payments once built.
            </p>
            <button
              onClick={() => setHistoryFor(null)}
              className="text-sm text-indigo-600 hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}