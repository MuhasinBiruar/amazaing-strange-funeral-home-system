import DataTable from '@/components/dataTable';
import { formatDate } from '@/utils/format';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import type { UncontractedDeceased } from 'shared';
import { getUncontractedDeceased } from '@/services/deceasedRecordService';
import PlanTypePill, { PLAN_TYPE_LABELS } from '@/components/planTypePill';
import ServiceStatusPill from '@/components/serviceStatusPill';
import ServiceStatusLegend from '@/components/serviceStatusLegend';

type ColumnKey = keyof UncontractedDeceased;

// No service status filter: a case only leaves Intake once it has a
// contract, so every record here is (almost always) in Intake.
type Filters = {
  plantype: UncontractedDeceased['plantype'] | null;
  dateRange: DateRangeValue;
};

const DEFAULT_FILTERS: Filters = {
  plantype: null,
  dateRange: { from: null, to: null },
};

const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'select',
    key: 'plantype',
    options: [
      { label: 'All plan types', value: null },
      { label: PLAN_TYPE_LABELS.Direct, value: 'Direct' },
      { label: PLAN_TYPE_LABELS.Life, value: 'Life' },
      { label: PLAN_TYPE_LABELS.LGU, value: 'LGU' },
    ],
  },
  {
    type: 'dateRange',
    key: 'dateRange',
    label: 'Filter by date created',
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
    render: (r) => <PlanTypePill plantype={r.plantype} />,
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
      deletable={(r) => ({ entitytype: 'case', id: r.caseid })}
      defaultSortBy="deceased_name"
      defaultSortOrder="desc"
      fetchData={({ filters, ...params }) =>
        getUncontractedDeceased({
          ...params,
          plantype: filters.plantype ?? undefined,
          startDate: filters.dateRange.from ?? undefined,
          endDate: filters.dateRange.to ?? undefined,
        })
      }
      onRowClick={onSelect}
      isRowSelected={(r) => r.caseid === selectedCaseId}
      emptyMessage="No deceased records are waiting for a contract."
      legend={<ServiceStatusLegend />}
      loadErrorMessage="Could not load deceased records. Try again."
      bodyOffsetClassName="top-12"
      refreshKey={refreshKey}
    />
  );
}
