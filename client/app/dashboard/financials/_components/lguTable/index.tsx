'use client';

import { useState } from 'react';
import DataTable from '@/components/dataTable';
import { formatCurrency, titleCase } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getLguCases } from '@/services/lguCasesService';
import type { GetLguCasesRow } from 'shared';

type ColumnKey = keyof GetLguCasesRow;

export default function LguTable() {
  const [refreshKey, _setRefreshKey] = useState(0);

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
      render: (l) => {
        const status = l.reimbursementstatus.toLowerCase();
        const isApproved = status === 'approved';
        const isRejected = status === 'rejected';

        return (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              isApproved
                ? 'bg-green-100 text-green-800'
                : isRejected
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {titleCase(status)}
          </span>
        );
      },
    },
    {
      key: 'reimbursementamount',
      label: 'Reimbursement amount',
      widthClassName: 'w-40',
      render: (l) => formatCurrency(l.reimbursementamount),
    },
  ];

  return (
    <>
      <DataTable<GetLguCasesRow, ColumnKey>
        title="LGU reimbursement log"
        countLabel={(total) => `${total} cases`}
        searchPlaceholder="Search by deceased name or case ID..."
        columns={columns}
        rowKey={(l) => l.lgucaseid}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters: _filters, sortBy, sortOrder, search, signal }) =>
          getLguCases({
            page: 1,
            limit: 10,
            sortBy: sortBy,
            sortOrder: sortOrder as 'asc' | 'desc',
            search,
            signal,
          })
        }
        emptyMessage="No LGU cases match your search."
        loadErrorMessage="Could not load LGU cases. Try again."
        refreshKey={refreshKey}
      />
    </>
  );
}
