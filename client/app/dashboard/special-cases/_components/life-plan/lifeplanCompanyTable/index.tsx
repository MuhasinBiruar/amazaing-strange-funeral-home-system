'use client';
import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/dataTable';
import { formatCurrency } from '@/utils/format';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import type { LifeplanCompanyAggregate } from 'shared';
import { getLifeplanCompanies } from '@/services/lifeplansService';
import CreateLifeplanCompanyPanel from './createLifeplanCompanyPanel';
import LifeplanRecordsPanel from './lifeplanRecordsPanel';

type ColumnKey = keyof LifeplanCompanyAggregate;

type Filters = {
  dateRange: DateRangeValue;
};

const DEFAULT_FILTERS: Filters = {
  dateRange: { from: null, to: null },
};

const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'dateRange',
    key: 'dateRange',
    label: 'Filter by date created',
  },
];

export default function LifeplanCompanyTable() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [viewing, setViewing] = useState<{
    company: LifeplanCompanyAggregate;
    dateRange: DateRangeValue;
  } | null>(null);
  // The filters the shown counts were fetched with, so "view records" lists
  // exactly the plans behind the number that was clicked.
  const fetchedFiltersRef = useRef<Filters>(DEFAULT_FILTERS);

  const columns: DataTableColumn<LifeplanCompanyAggregate, ColumnKey>[] = [
    {
      key: 'companyname',
      label: 'Company Name',
      widthClassName: 'w-55',
      cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
      render: (d) => d.companyname,
    },
    {
      key: 'minimumthreshold',
      label: 'Minimum Threshold',
      widthClassName: 'w-55',
      cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
      render: (d) => formatCurrency(d.minimumthreshold),
    },
    {
      key: 'total_serviced_amount',
      label: 'Total Serviced Amount',
      widthClassName: 'w-55',
      cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
      render: (d) => formatCurrency(d.total_serviced_amount),
    },
    {
      key: 'totalplans',
      label: 'Total Plans',
      widthClassName: 'w-55',
      cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
      render: (d) =>
        d.totalplans === 0 ? (
          0
        ) : (
          <button
            type="button"
            onClick={() =>
              setViewing({
                company: d,
                dateRange: fetchedFiltersRef.current.dateRange,
              })
            }
            title="View records"
            className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
          >
            {d.totalplans} · View records
          </button>
        ),
    },
    {
      key: 'contactinfo',
      label: 'Contact Info',
      widthClassName: 'w-55',
      cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
      render: (d) => (d.contactinfo === null ? '—' : d.contactinfo),
    },
  ];

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          Add Company
        </button>
      </div>

      <DataTable<LifeplanCompanyAggregate, ColumnKey, Filters>
        title="Life plan companies"
        columns={columns}
        countLabel={(total) => `${total} companies`}
        searchPlaceholder="Search company..."
        filters={FILTERS}
        defaultFilters={DEFAULT_FILTERS}
        rowKey={(row) => row.companyid}
        defaultSortBy="companyname"
        defaultSortOrder="asc"
        fetchData={({ filters, ...params }) => {
          fetchedFiltersRef.current = filters;
          return getLifeplanCompanies({
            ...params,
            startDate: filters.dateRange.from ?? undefined,
            endDate: filters.dateRange.to ?? undefined,
          });
        }}
        refreshKey={refreshKey}
        emptyMessage="No life plan companies match your search."
        loadErrorMessage="Could not load life plan companies. Try again."
      />

      {isCreating && (
        <CreateLifeplanCompanyPanel
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            setRefreshKey((key) => key + 1);
          }}
        />
      )}
      {viewing && (
        <LifeplanRecordsPanel
          key={viewing.company.companyid}
          companyid={viewing.company.companyid}
          companyname={viewing.company.companyname}
          dateRange={viewing.dateRange}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}
