'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/dataTable';
import { formatCurrency, titleCase } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getLguCases, type LguCase } from '@/services/financialService';
import CreateLguPanel from './createLguPanel';
import TransactionHistoryPanel from '../directTable/transactionHistoryPanel';

type ColumnKey = keyof LguCase;

export default function LguTable() {
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyFor, setHistoryFor] = useState<LguCase | null>(null);

  const columns: DataTableColumn<LguCase, ColumnKey>[] = [
    {
      key: 'lgucaseid',
      label: 'History',
      widthClassName: 'w-25',
      render: (l) => (
        <button
          type="button"
          onClick={() => setHistoryFor(l)}
          className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer text-sm"
        >
          View history
        </button>
      ),
    },
    {
      key: 'deceased_name',
      label: 'Deceased name',
      widthClassName: 'w-50',
      cellClassName: 'px-5 py-3 wrap-break-word',
      render: (l) => l.deceased_name,
    },
    {
      key: 'caseid',
      label: 'Case ID',
      widthClassName: 'w-25',
      render: (l) => l.caseid,
    },
    {
      key: 'reimbursementstatus',
      label: 'Reimbursement status',
      widthClassName: 'w-40',
      render: (l) => titleCase(l.reimbursementstatus),
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

      <DataTable<LguCase, ColumnKey>
        title="LGU reimbursement log"
        countLabel={(total) => `${total} cases`}
        searchPlaceholder="Search by deceased name or case ID..."
        columns={columns}
        rowKey={(l) => l.lgucaseid}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters: _filters, ...params }) => getLguCases(params)}
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
          key={historyFor.lgucaseid}
          caseid={historyFor.caseid}
          deceasedName={historyFor.deceased_name}
          onClose={() => setHistoryFor(null)}
        />
      )}
    </>
  );
}