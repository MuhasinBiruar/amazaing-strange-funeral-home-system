import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import PillBadge from '@/components/pillBadge';

export type ColumnKey = keyof Case;

type Filters = {
  status: Case['servicestatus'] | null;
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
      { label: 'Active', value: 'active' },
      { label: 'Completed', value: 'completed' },
      { label: 'Intake', value: 'intake' },
      { label: 'Pending', value: 'pending' },
    ],
  },
  {
    type: 'dateRange',
    key: 'dateRange',
    label: 'Filter by date created',
  },
];

export default function CaseTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseidParam = searchParams.get('caseid');
  const caseidValue = caseidParam ? Number(caseidParam) : undefined;
  const caseid =
    caseidValue !== undefined &&
    Number.isSafeInteger(caseidValue) &&
    caseidValue > 0
      ? caseidValue
      : undefined;
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedCase, setSelectedCase] = useState<{
    record: Case;
    sourceCaseId: number | null;
  } | null>(null);

  useEffect(() => {
    if (caseid === undefined) return;

    const targetCaseId = caseid;
    const controller = new AbortController();

    async function openCase() {
      try {
        const result = await getCases({
          page: 1,
          limit: 1,
          sortBy: 'caseid',
          sortOrder: 'asc',
          caseid: targetCaseId,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setSelectedCase(
            result.data[0]
              ? { record: result.data[0], sourceCaseId: targetCaseId }
              : null,
          );
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to load the requested case:', error);
      }
    }

    openCase();
    return () => controller.abort();
  }, [caseid]);

  const columns: DataTableColumn<Case, ColumnKey>[] = [
    {
      key: 'deceased_name',
      label: 'Deceased name',
      widthClassName: 'w-45',
      cellClassName: 'px-5 py-3 wrap-break-word',
      render: (c) => (
        <button
          type="button"
          onClick={() => setSelectedCase({ record: c, sourceCaseId: null })}
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
      render: (c) => (
        <PillBadge
          variant={
            c.servicestatus === 'completed'
              ? 'info'
              : c.servicestatus === 'active'
                ? 'success'
                : c.servicestatus === 'pending'
                  ? 'warning'
                  : 'error'
          }
        >
          {titleCase(c.servicestatus)}
        </PillBadge>
      ),
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
      <DataTable<Case, ColumnKey, Filters>
        key={caseid ?? 'all-cases'}
        title="Log"
        exportFileName="cases"
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
            caseid,
            status: filters.status ?? undefined,
            startDate: filters.dateRange.from ?? undefined,
            endDate: filters.dateRange.to ?? undefined,
          })
        }
        refreshKey={refreshKey}
        emptyMessage="No contracts match your search."
        loadErrorMessage="Could not load contracts. Try again."
        bodyOffsetClassName="top-17.25"
      />

      {selectedCase &&
        (selectedCase.sourceCaseId === null ||
          selectedCase.sourceCaseId === caseid) && (
          <CaseDetailPanel
            key={selectedCase.record.caseid}
            caseid={selectedCase.record.caseid}
            representativeid={selectedCase.record.representativeid}
            onClose={() => {
              setSelectedCase(null);
              if (caseid !== undefined) {
                router.replace('/dashboard/case-management?tab=view', {
                  scroll: false,
                });
              }
            }}
            setRefreshKey={setRefreshKey}
          />
        )}
    </>
  );
}
