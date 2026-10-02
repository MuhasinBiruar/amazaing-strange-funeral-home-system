'use client';

import { useState } from 'react';
import DataTable from '@/components/dataTable';
import { formatCurrency } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import type { GetLifeplansQueryRow } from 'shared';
import { getLifeplans } from '@/services/lifeplansService';

type ColumnKey = keyof GetLifeplansQueryRow;

export default function LifeplanTable() {
  const [refreshKey, _setRefreshKey] = useState(0);

  const columns: DataTableColumn<GetLifeplansQueryRow, ColumnKey>[] = [
    {
      key: 'planholdername',
      label: 'Plan holder',
      widthClassName: 'w-40',
      cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
      render: (l) => l.planholdername,
    },
    {
      key: 'deceased_name',
      label: 'Deceased name',
      widthClassName: 'w-40',
      cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
      render: (l) => l.deceased_name,
    },
    {
      key: 'plannumber',
      label: 'Plan number',
      widthClassName: 'w-30',
      render: (l) => l.plannumber,
    },
    {
      key: 'companyname',
      label: 'Company',
      widthClassName: 'w-35',
      cellClassName: 'px-5 py-3 text-gray-900 font-medium wrap-break-word',
      render: (l) => l.companyname,
    },
    {
      key: 'totalamount',
      label: 'Total amount',
      widthClassName: 'w-32.5',
      render: (l) => formatCurrency(l.totalamount),
    },
    {
      key: 'minimumthreshold',
      label: 'Min. threshold',
      widthClassName: 'w-32.5',
      render: (l) => formatCurrency(l.minimumthreshold),
    },
  ];

  return (
    <>
      <DataTable<GetLifeplansQueryRow, ColumnKey>
        title="Life plan log"
        countLabel={(total) => `${total} plans`}
        searchPlaceholder="Search by plan holder, number, or company..."
        columns={columns}
        rowKey={(l) => l.planid}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters: _filters, sortBy, sortOrder, search, signal }) =>
          getLifeplans({
            page: 1,
            limit: 10,
            sortBy: sortBy,
            sortOrder: sortOrder as 'asc' | 'desc',
            search,
            signal,
          })
        }
        bodyOffsetClassName="top-12"
        emptyMessage="No life plans match your search."
        loadErrorMessage="Could not load life plans. Try again."
        refreshKey={refreshKey}
      />
    </>
  );
}
