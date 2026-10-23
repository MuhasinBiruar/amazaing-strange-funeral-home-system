'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/dataTable';
import { formatCurrency } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import type { LguAggregate } from 'shared';
import { getLgus } from '@/services/lgusService';
import DateRangePicker from '@/app/dashboard/financials/_components/summaryPanel/dateRangePicker';
import CreateLguPanel from './createLguPanel';

type ColumnKey = keyof LguAggregate;

const COLUMNS: DataTableColumn<LguAggregate, ColumnKey>[] = [
  {
    key: 'lguname',
    label: 'LGU Name',
    widthClassName: 'w-55',
    cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
    render: (d) => d.lguname,
  },
  {
    key: 'total_serviced_amount',
    label: 'Total Serviced Amount',
    widthClassName: 'w-55',
    cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
    render: (d) => formatCurrency(d.total_serviced_amount),
  },
  {
    key: 'totalrecords',
    label: 'Total Records',
    widthClassName: 'w-55',
    cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
    render: (d) => d.totalrecords,
  },
  {
    key: 'contactinfo',
    label: 'Contact Info',
    widthClassName: 'w-55',
    cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
    render: (d) => (d.contactinfo === null ? '—' : d.contactinfo),
  },
];

/** The LGU counterpart of `LifeplanCompanyTable`, without a minimum threshold. */
export default function LguTable() {
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          Add LGU
        </button>
      </div>

      <DataTable<LguAggregate, ColumnKey>
        title="LGUs"
        columns={COLUMNS}
        countLabel={(total) => `${total} LGUs`}
        searchPlaceholder="Search LGU..."
        rowKey={(row) => row.lguid}
        defaultSortBy="lguname"
        defaultSortOrder="asc"
        fetchData={({ filters: _filters, ...params }) =>
          getLgus({
            ...params,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          })
        }
        additionalFilterSlot={
          <DateRangePicker
            onApply={(startDate, endDate) => {
              setDateRange({ startDate, endDate });
              setRefreshKey((key) => key + 1);
            }}
          />
        }
        refreshKey={refreshKey}
        emptyMessage="No LGUs match your search."
        loadErrorMessage="Could not load LGUs. Try again."
      />

      {isCreating && (
        <CreateLguPanel
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            setRefreshKey((key) => key + 1);
          }}
        />
      )}
    </>
  );
}
