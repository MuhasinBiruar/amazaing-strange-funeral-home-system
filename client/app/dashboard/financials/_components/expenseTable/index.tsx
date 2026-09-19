'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/dataTable';
import { formatCurrency } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getExpenses, type Expense } from '@/services/financialService';
import RecordExpenseModal from './RecordExpenseModal';

type ColumnKey = keyof Expense;

export default function ExpenseTable() {
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: DataTableColumn<Expense, ColumnKey>[] = [
    {
      key: 'expensedate',
      label: 'Date',
      widthClassName: 'w-40',
      render: (e) => new Date(e.expensedate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      key: 'description',
      label: 'Description',
      widthClassName: 'w-full',
      cellClassName: 'px-5 py-3 wrap-break-word font-medium text-gray-900',
      render: (e) => e.description,
    },
    {
      key: 'recordedby',
      label: 'Recorded By',
      widthClassName: 'w-40',
      cellClassName: 'text-gray-500',
      render: (e) => e.recordedby || 'Staff',
    },
    {
      key: 'amount',
      label: 'Amount',
      widthClassName: 'w-40',
      cellClassName: 'text-red-500 font-medium',
      render: (e) => formatCurrency(e.amount),
    },
  ];

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 rounded-lg bg-red-500 text-white text-sm font-medium px-4 py-2 hover:bg-red-600 transition cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          Record Expense
        </button>
      </div>

      <DataTable<Expense, ColumnKey>
        title="General Expenses"
        countLabel={(total) => `${total} records`}
        searchPlaceholder="Search expenses..."
        columns={columns}
        rowKey={(e) => e.expenseid}
        defaultSortBy="expensedate"
        defaultSortOrder="desc"
        fetchData={({ filters: _filters, ...params }) => getExpenses(params)}
        emptyMessage="No expenses recorded yet."
        loadErrorMessage="Could not load expenses."
        refreshKey={refreshKey}
      />

      {isCreating && (
        <RecordExpenseModal
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}