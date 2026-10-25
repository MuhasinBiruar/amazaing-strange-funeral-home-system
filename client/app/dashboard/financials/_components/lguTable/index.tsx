'use client';

import { useState } from 'react';
import DataTable from '@/components/dataTable';
import { formatCurrency, titleCase } from '@/utils/format';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import { getLguCases } from '@/services/lguCasesService';
import type { GetLguCasesRow } from 'shared';
import EditLguCasePanel from './editLguCasePanel';
import ReimbursementStatusPill from '@/components/reimbursementStatusPill';

type ColumnKey = keyof GetLguCasesRow;

type Filters = {
  status: GetLguCasesRow['reimbursementstatus'] | null;
  dateRange: DateRangeValue;
};

const DEFAULT_FILTERS: Filters = {
  status: null,
  dateRange: { from: null, to: null },
};

const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'select',
    key: 'status',
    options: [
      { label: 'All statuses', value: null },
      { label: 'Pending', value: 'pending' },
      { label: 'Approved', value: 'approved' },
      { label: 'Released', value: 'released' },
      { label: 'Rejected', value: 'rejected' },
    ],
  },
  {
    type: 'dateRange',
    key: 'dateRange',
    label: 'Filter by date created',
  },
];

export default function LguTable() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<GetLguCasesRow | null>(null);

  const columns: DataTableColumn<GetLguCasesRow, ColumnKey>[] = [
    {
      key: 'deceased_name',
      label: 'Deceased name',
      widthClassName: 'w-50',
      cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
      render: (l) => l.deceased_name,
    },
    {
      key: 'reimbursementstatus',
      label: 'Reimbursement status',
      widthClassName: 'w-40',
      render: (l) => <ReimbursementStatusPill status={l.reimbursementstatus} />,
      exportValue: (l) => titleCase(l.reimbursementstatus),
    },
    {
      key: 'reimbursementamount',
      label: 'Reimbursement amount',
      widthClassName: 'w-40',
      render: (l) => formatCurrency(l.reimbursementamount),
    },
    {
      key: 'lgucaseid',
      label: 'Actions',
      exportable: false,
      widthClassName: 'w-28',
      render: (row) => (
        <button
          type="button"
          onClick={() => setEditing(row)}
          className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer text-sm font-medium"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <>
      <DataTable<GetLguCasesRow, ColumnKey, Filters>
        title="LGU reimbursement log"
        exportFileName="lgu-reimbursements"
        countLabel={(total) => `${total} cases`}
        searchPlaceholder="Search by deceased name or case ID..."
        filters={FILTERS}
        defaultFilters={DEFAULT_FILTERS}
        columns={columns}
        bodyOffsetClassName="top-17.25"
        rowKey={(l) => l.lgucaseid}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters, ...params }) =>
          getLguCases({
            ...params,
            status: filters.status ?? undefined,
            startDate: filters.dateRange.from ?? undefined,
            endDate: filters.dateRange.to ?? undefined,
          })
        }
        emptyMessage="No LGU cases match your search."
        loadErrorMessage="Could not load LGU cases. Try again."
        refreshKey={refreshKey}
      />

      {editing && (
        <EditLguCasePanel
          lguCase={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}
