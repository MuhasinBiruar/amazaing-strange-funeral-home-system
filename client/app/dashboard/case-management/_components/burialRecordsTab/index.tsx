'use client';

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import type { BurialRecord } from 'shared';
import DataTable from '@/components/dataTable';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import { getBurialRecords } from '@/services/burialRecordService';
import { formatDate } from '@/utils/format';
import BurialRecordPanel from './burialRecordPanel';
import ServiceStatusPill from '@/components/serviceStatusPill';
import PlanTypePill, { PLAN_TYPE_LABELS } from '@/components/planTypePill';

type ColumnKey =
  | 'deceased_name'
  | 'burialdate'
  | 'burialsite'
  | 'servicestatus'
  | 'plantype'
  | 'burialid';
type Filters = {
  status: BurialRecord['servicestatus'] | null;
  plantype: BurialRecord['plantype'] | null;
  dateRange: DateRangeValue;
};

const DEFAULT_FILTERS: Filters = {
  status: null,
  plantype: null,
  dateRange: { from: null, to: null },
};

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
    label: 'Filter by burial date',
  },
];

export default function BurialRecordsTab() {
  const [editing, setEditing] = useState<BurialRecord | null | undefined>(
    undefined,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: DataTableColumn<BurialRecord, ColumnKey>[] = [
    {
      key: 'deceased_name',
      label: 'Deceased name',
      render: (record) => record.deceased_name,
    },
    {
      key: 'burialdate',
      label: 'Burial date',
      render: (record) => formatDate(record.burialdate),
    },
    {
      key: 'burialsite',
      label: 'Burial site',
      render: (record) => record.burialsite ?? '—',
    },
    {
      key: 'servicestatus',
      label: 'Service status',
      render: (record) => <ServiceStatusPill status={record.servicestatus} />,
      exportValue: (record) => record.servicestatus,
    },
    {
      key: 'plantype',
      label: 'Plan type',
      render: (record) => <PlanTypePill plantype={record.plantype} />,
      exportValue: (record) => PLAN_TYPE_LABELS[record.plantype],
    },
    {
      key: 'burialid',
      label: 'Edit',
      sortable: false,
      exportable: false,
      render: (record) => (
        <button
          type="button"
          onClick={() => setEditing(record)}
          className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
          aria-label={`Edit burial record for ${record.deceased_name}`}
        >
          <Pencil size={15} />
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer"
        >
          <Plus size={16} /> Record burial
        </button>
      </div>
      <DataTable<BurialRecord, ColumnKey, Filters>
        title="Burial records"
        exportFileName="burial-records"
        countLabel={(total) => `${total} burial records`}
        searchPlaceholder="Search burial records..."
        filters={FILTERS}
        defaultFilters={DEFAULT_FILTERS}
        columns={columns}
        rowKey={(record) => record.burialid}
        deletable={(record) => ({
          entitytype: 'burialrecord',
          id: record.burialid,
        })}
        defaultSortBy="burialdate"
        defaultSortOrder="desc"
        fetchData={({ filters, sortBy, ...params }) =>
          getBurialRecords({
            ...params,
            status: filters.status ?? undefined,
            plantype: filters.plantype ?? undefined,
            startDate: filters.dateRange.from ?? undefined,
            endDate: filters.dateRange.to ?? undefined,
            sortBy:
              sortBy === 'burialid' ||
              sortBy === 'servicestatus' ||
              sortBy === 'plantype'
                ? 'deceased_name'
                : sortBy,
          })
        }
        refreshKey={refreshKey}
        emptyMessage="No burial records found."
        loadErrorMessage="Could not load burial records. Try again."
      />
      {editing !== undefined && (
        <BurialRecordPanel
          record={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setRefreshKey((key) => key + 1);
          }}
        />
      )}
    </>
  );
}
