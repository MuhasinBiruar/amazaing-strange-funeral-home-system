'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/dataTable';
import { formatCurrency, titleCase } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getLguCases } from '@/services/lguCasesService';
import CreateLguPanel from './createLguPanel';
import TransactionHistoryPanel from '../directTable/transactionHistoryPanel';
import RecordTransactionModal from '../directTable/recordTransactionModal';
import type { GetLguCasesRow } from 'shared';

type ColumnKey = keyof GetLguCasesRow;

export default function LguTable() {
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyFor, setHistoryFor] = useState<GetLguCasesRow | null>(null);
  const [paymentFor, setPaymentFor] = useState<GetLguCasesRow | null>(null);

  const columns: DataTableColumn<GetLguCasesRow, ColumnKey>[] = [
    {
      key: 'lgucaseid',
      label: 'Actions',
      widthClassName: 'w-48',
      render: (l) => (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPaymentFor(l)}
            className="text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer text-sm font-medium"
          >
            Record payment
          </button>
          <button
            type="button"
            onClick={() => setHistoryFor(l)}
            className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer text-sm"
          >
            View history
          </button>
        </div>
      ),
    },
    {
      key: 'deceased_name',
      label: 'Deceased name',
      widthClassName: 'w-50',
      cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
      render: (l) => l.deceased_name,
    },
    {
      key: 'caseid',
      label: 'Actions',
      widthClassName: 'w-48',
      render: (row) => (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPaymentFor(row)}
            className="text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer text-sm font-medium"
          >
            Record payment
          </button>
          <button
            type="button"
            onClick={() => setHistoryFor(row)}
            className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer text-sm"
          >
            View history
          </button>
        </div>
      ),
    },
    {
      key: 'reimbursementstatus',
      label: 'Reimbursement status',
      widthClassName: 'w-40',
      render: (l) => {
        const status = l.reimbursementstatus.toLowerCase();
        const isApproved = status === 'approved';
        const isRejected = status === 'rejected';

        return (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              isApproved
                ? 'bg-green-100 text-green-800'
                : isRejected
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {titleCase(status)}
          </span>
        );
      },
    },
    {
      key: 'reimbursementamount',
      label: 'Reimbursement amount',
      widthClassName: 'w-40',
      render: (l) => formatCurrency(l.reimbursementamount),
    },
  ];

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition cursor-pointer"
        >
          <Plus size={16} />
          New LGU case
        </button>
      </div>

      <DataTable<GetLguCasesRow, ColumnKey>
        title="LGU reimbursement log"
        countLabel={(total) => `${total} cases`}
        searchPlaceholder="Search by deceased name or case ID..."
        columns={columns}
        rowKey={(l) => l.lgucaseid}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters: _filters, sortBy, sortOrder, search, signal }) =>
          getLguCases({
            page: 1,
            limit: 10,
            sortBy: sortBy,
            sortOrder: sortOrder as 'asc' | 'desc',
            search,
            signal,
          })
        }
        emptyMessage="No LGU cases match your search."
        loadErrorMessage="Could not load LGU cases. Try again."
        refreshKey={refreshKey}
      />

      {isCreating && (
        <CreateLguPanel
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
      {historyFor && (
        <TransactionHistoryPanel
          key={`history-${historyFor.lgucaseid}`}
          caseid={historyFor.caseid}
          deceasedName={historyFor.deceased_name}
          onClose={() => setHistoryFor(null)}
        />
      )}
      {paymentFor && (
        <RecordTransactionModal
          key={`payment-${paymentFor.lgucaseid}`}
          caseId={paymentFor.caseid}
          deceasedName={paymentFor.deceased_name}
          onClose={() => setPaymentFor(null)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {paymentFor && (
        <RecordTransactionModal
          key={`payment-${paymentFor.caseid}`}
          caseId={paymentFor.caseid}
          deceasedName={paymentFor.deceased_name}
          onClose={() => setPaymentFor(null)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}
