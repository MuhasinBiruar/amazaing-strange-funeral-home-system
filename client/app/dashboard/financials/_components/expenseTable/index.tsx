'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/dataTable';
import { formatCurrency } from '@/utils/format';
import type { DataTableColumn, FilterDef } from '@/components/dataTable/types';
import { getExpenses } from '@/services/expensesService';
import type { ExpenseLog, ExpenseLogSource } from 'shared';
import RecordExpensePanel from './recordExpensePanel';

type ColumnKey = keyof ExpenseLog;

type Filters = {
  source: ExpenseLogSource | null;
};

const DEFAULT_FILTERS: Filters = { source: null };

const SOURCE_LABELS: Record<
  ExpenseLogSource,
  { label: string; className: string }
> = {
  expense: { label: 'General', className: 'bg-gray-100 text-gray-700' },
  casket: { label: 'Casket delivery', className: 'bg-amber-50 text-amber-700' },
  formalin: {
    label: 'Formalin delivery',
    className: 'bg-sky-50 text-sky-700',
  },
};

const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'select',
    key: 'source',
    options: [
      { label: 'All categories', value: null },
      { label: 'General', value: 'expense' },
      { label: 'Casket deliveries', value: 'casket' },
      { label: 'Formalin deliveries', value: 'formalin' },
    ],
  },
];

/**
 * Everything paid out: general expenses recorded here, plus what was paid
 * for each casket and formalin delivery (recorded from the inventory page).
 */
export default function ExpenseTable() {
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: DataTableColumn<ExpenseLog, ColumnKey>[] = [
    {
      key: 'expensedate',
      label: 'Date',
      widthClassName: 'w-40',
      render: (e) =>
        new Date(e.expensedate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      key: 'source',
      label: 'Category',
      widthClassName: 'w-40',
      render: (e) => {
        const { label, className } = SOURCE_LABELS[e.source];
        return (
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${className}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: 'description',
      label: 'Description',
      widthClassName: 'w-full',
      cellClassName: 'px-5 py-3 wrap-break-word text-gray-900',
      render: (e) => e.description,
    },
    {
      key: 'staff_name',
      label: 'Recorded By',
      widthClassName: 'w-40',
      cellClassName: 'text-gray-500',
      render: (e) => e.staff_name ?? '—',
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

      <DataTable<ExpenseLog, ColumnKey, Filters>
        title="Expenses"
        countLabel={(total) => `${total} records`}
        searchPlaceholder="Search expenses..."
        filters={FILTERS}
        defaultFilters={DEFAULT_FILTERS}
        columns={columns}
        // `id` is only unique within its own source table.
        rowKey={(e) => `${e.source}-${e.id}`}
        defaultSortBy="expensedate"
        defaultSortOrder="desc"
        fetchData={({ filters, ...params }) =>
          getExpenses({ ...params, source: filters.source ?? undefined })
        }
        emptyMessage="No expenses recorded yet."
        loadErrorMessage="Could not load expenses."
        bodyOffsetClassName="top-17.25"
        refreshKey={refreshKey}
      />

      {isCreating && (
        <RecordExpensePanel
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
