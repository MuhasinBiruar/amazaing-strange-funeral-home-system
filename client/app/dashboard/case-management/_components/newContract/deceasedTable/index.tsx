import DataTable from '@/components/dataTable';
import { formatDate } from '@/utils/format';
import type { DataTableColumn, FilterDef } from '@/components/dataTable/types';
import type { UncontractedDeceased } from 'shared';
import { getUncontractedDeceased } from '@/services/deceasedRecordService';
import PillBadge from '@/components/pillBadge';
import ServiceStatusPill from '@/components/serviceStatusPill';

type ColumnKey = keyof UncontractedDeceased;

type Filters = {
  status: UncontractedDeceased['servicestatus'] | null;
};

const DEFAULT_FILTERS: Filters = { status: null };

const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'select',
    key: 'status',
    options: [
      { label: 'All statuses', value: null },
      { label: 'Intake', value: 'intake' },
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
      { label: 'Completed', value: 'completed' },
    ],
  },
];

const COLUMNS: DataTableColumn<UncontractedDeceased, ColumnKey>[] = [
  {
    key: 'deceased_name',
    label: 'Deceased name',
    widthClassName: 'w-45',
    cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
    render: (r) => r.deceased_name,
  },
  {
    key: 'representative_name',
    label: 'Representative name',
    widthClassName: 'w-45',
    cellClassName: 'px-5 py-3 text-gray-500 wrap-break-word',
    render: (r) => r.representative_name || '—',
  },
  {
    key: 'servicestatus',
    label: 'Service status',
    widthClassName: 'w-32.5',
    render: (r) => <ServiceStatusPill status={r.servicestatus} />,
  },
  {
    key: 'plantype',
    label: 'Plan type',
    widthClassName: 'w-27.5',
    render: (r) => (
      <PillBadge
        variant={
          r.plantype === 'Direct'
            ? 'success'
            : r.plantype === 'LGU'
              ? 'warning'
              : 'info'
        }
      >
        {r.plantype}
      </PillBadge>
    ),
  },
  {
    key: 'datecreated',
    label: 'Date created',
    widthClassName: 'w-32.5',
    render: (r) => formatDate(r.datecreated),
  },
  {
    key: 'managed_by_name',
    label: 'Manager name',
    widthClassName: 'w-40',
    cellClassName: 'px-5 py-3 text-gray-500 wrap-break-word',
    render: (r) => r.managed_by_name || '—',
  },
];

export default function DeceasedTable({
  selectedCaseId,
  onSelect,
  refreshKey,
}: {
  selectedCaseId: number | null;
  onSelect: (record: UncontractedDeceased) => void;
  refreshKey: number;
}) {
  return (
    <DataTable<UncontractedDeceased, ColumnKey, Filters>
      title="Select a deceased record"
      countLabel={(total) => `${total} awaiting a contract`}
      searchPlaceholder="Search deceased..."
      filters={FILTERS}
      defaultFilters={DEFAULT_FILTERS}
      columns={COLUMNS}
      rowKey={(r) => r.caseid}
      defaultSortBy="deceased_name"
      defaultSortOrder="desc"
      fetchData={({ filters, ...params }) =>
        getUncontractedDeceased({
          ...params,
          status: filters.status ?? undefined,
        })
      }
      onRowClick={onSelect}
      isRowSelected={(r) => r.caseid === selectedCaseId}
      emptyMessage="No deceased records are waiting for a contract."
      loadErrorMessage="Could not load deceased records. Try again."
      bodyOffsetClassName="top-12"
      refreshKey={refreshKey}
    />
  );
}
