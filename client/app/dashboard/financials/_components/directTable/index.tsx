'use client';

import { useState } from 'react';
import DataTable from '@/components/dataTable';
import { formatCurrency } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getDirectPlans, type DirectPlan } from '@/services/financialService';
import TransactionHistoryPanel from './transactionHistoryPanel';
import RecordTransactionModal from './RecordTransactionModal';

type ColumnKey = keyof DirectPlan;

export default function DirectTable() {
  const [historyFor, setHistoryFor] = useState<DirectPlan | null>(null);
  const [paymentFor, setPaymentFor] = useState<DirectPlan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
      label: 'Actions',
      widthClassName: 'w-48',
      render: (d) => (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPaymentFor(d)}
            className="text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer text-sm font-medium"
          >
            Record payment
          </button>
          <button
            type="button"
            onClick={() => setHistoryFor(d)}
            className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer text-sm"
          >
            View history
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<DirectPlan, ColumnKey>
        key={refreshKey}
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

      {historyFor && (
        <TransactionHistoryPanel
          key={`history-${historyFor.caseid}`}
          caseid={historyFor.caseid}
          deceasedName={historyFor.deceased_name}
          onClose={() => setHistoryFor(null)}
        />
      )}

      {paymentFor && (
        <RecordTransactionModal
          key={`payment-${paymentFor.caseid}`}
          caseId={paymentFor.caseid}
          deceasedName={paymentFor.deceased_name}
          onClose={() => setPaymentFor(null)}
          onSuccess={() => {
            // Force the table to remount and refetch new totals
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </>
  );
}