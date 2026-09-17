import { useState } from 'react';
import DataTable from '@/components/dataTable';
import { formatCurrency, formatDate, titleCase } from '@/utils/format';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import type { Case } from 'shared';
import { getCases } from '@/services/caseService';
import CaseDetailPanel from '../caseDetailPanel';

export type ColumnKey = keyof Case;

type CaseFilters = {
  status: Case['servicestatus'] | null;
  dateRange: DateRangeValue;
};

const DEFAULT_FILTERS: CaseFilters = {
  status: null,
  dateRange: { from: null, to: null },
};

const FILTERS: FilterDef<CaseFilters>[] = [
  {
    type: 'select',
    key: 'status',
    options: [
      { label: 'All statuses', value: null },
      { label: 'Active', value: 'active' },
      { label: 'Completed', value: 'completed' },
      { label: 'Intake', value: 'intake' },
      { label: 'Pending', value: 'pending' },
    ],
  },
  {
    type: 'dateRange',
    key: 'dateRange',
    label: 'Created',
  },
];

export default function CaseTable() {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const columns: DataTableColumn<Case, ColumnKey>[] = [
    {
      key: 'deceased_name',
      label: 'Deceased name',
      widthClassName: 'w-45',
      cellClassName: 'px-5 py-3 wrap-break-word',
      render: (c) => (
        <button
          type="button"
          onClick={() => setSelectedCase(c)}
          className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer text-center"
        >
          {c.deceased_name}
        </button>
      ),
    },
    {
      key: 'representative_name',
      label: 'Representative name',
      widthClassName: 'w-45',
      cellClassName: 'px-5 py-3 text-gray-500 wrap-break-word',
      render: (c) => c.representative_name,
    },
    {
      key: 'burialdatedeadline',
      label: 'Burial deadline',
      widthClassName: 'w-35',
      render: (c) => formatDate(c.burialdatedeadline),
    },
    {
      key: 'dateofdeath',
      label: 'Date of death',
      widthClassName: 'w-32.5',
      render: (c) => formatDate(c.dateofdeath),
    },
    {
      key: 'total_pending_docs',
      label: 'Total pending docs.',
      widthClassName: 'w-30',
      render: (c) => c.total_pending_docs,
    },
    {
      key: 'totalamount',
      label: 'Total amount',
      widthClassName: 'w-35',
      render: (c) => formatCurrency(c.totalamount),
    },
    {
      key: 'servicestatus',
      label: 'Service status',
      widthClassName: 'w-32.5',
      render: (c) => titleCase(c.servicestatus),
    },
    {
      key: 'datecreated',
      label: 'Date created',
      widthClassName: 'w-32.5',
      render: (c) => formatDate(c.datecreated),
    },
    {
      key: 'managed_by_name',
      label: 'Manager name',
      widthClassName: 'w-40',
      cellClassName: 'px-5 py-3 text-gray-500 wrap-break-word',
      render: (c) => c.managed_by_name,
    },
  ];

  return (
    <>
      <DataTable<Case, ColumnKey, CaseFilters>
        title="Log"
        countLabel={(total) => `${total} items`}
        searchPlaceholder="Search contracts..."
        filters={FILTERS}
        defaultFilters={DEFAULT_FILTERS}
        columns={columns}
        rowKey={(c) => c.caseid}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters, ...params }) =>
          getCases({
            ...params,
            status: filters.status ?? undefined,
            startDate: filters.dateRange.from ?? undefined,
            endDate: filters.dateRange.to ?? undefined,
          })
        }
        emptyMessage="No contracts match your search."
        loadErrorMessage="Could not load contracts. Try again."
        bodyOffsetClassName="top-17.25"
      />

      {selectedCase && (
        <CaseDetailPanel
          key={selectedCase.caseid}
          caseid={selectedCase.caseid}
          representativeid={selectedCase.representativeid}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </>
  );
}
