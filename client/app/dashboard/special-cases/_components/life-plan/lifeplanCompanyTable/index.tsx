'use client';
import { useState } from 'react';
import DataTable from '@/components/dataTable';
import { formatCurrency } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import type { LifeplanCompanyAggregate } from 'shared';
import { getLifeplanCompanies } from '@/services/lifeplansService';
import DateRangePicker from '@/app/dashboard/financials/_components/summaryPanel/dateRangePicker';

type ColumnKey = keyof LifeplanCompanyAggregate;

const COLUMNS: DataTableColumn<LifeplanCompanyAggregate, ColumnKey>[] = [
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
    render: (d) => d.totalplans,
  },
  {
    key: 'contactinfo',
    label: 'Contact Info',
    widthClassName: 'w-55',
    cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
    render: (d) =>
      d.contactinfo === null ? 'no contact info provided' : d.contactinfo,
  },
];

export default function LifeplanCompanyTable() {
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <DataTable<LifeplanCompanyAggregate, ColumnKey>
        title="Life plan companies"
        columns={COLUMNS}
        countLabel={(total) => `${total} companies`}
        searchPlaceholder="Search company..."
        rowKey={(row) => row.companyid}
        defaultSortBy="companyname"
        defaultSortOrder="asc"
        fetchData={({ filters: _filters, ...params }) =>
          getLifeplanCompanies({
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
        emptyMessage="No life plan companies match your search."
        loadErrorMessage="Could not load life plan companies. Try again."
      />
    </>
  );
}
