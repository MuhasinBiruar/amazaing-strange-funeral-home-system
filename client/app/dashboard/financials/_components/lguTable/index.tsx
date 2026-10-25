'use client';

import { useState } from 'react';
import DataTable from '@/components/dataTable';
import { formatCurrency, titleCase } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getLguCases } from '@/services/lguCasesService';
import type { GetLguCasesRow } from 'shared';
import EditLguCasePanel from './editLguCasePanel';
import PillBadge from '@/components/pillBadge';

type ColumnKey = keyof GetLguCasesRow;

export default function LguTable() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<GetLguCasesRow | null>(null);

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

        return (
          <PillBadge
            variant={
              status === 'released'
                ? 'info'
                : status === 'approved'
                  ? 'success'
                  : status === 'pending'
                    ? 'warning'
                    : 'error'
            }
          >
            {titleCase(status)}
          </PillBadge>
        );
      },
    },
    {
      key: 'reimbursementamount',
      label: 'Reimbursement amount',
      widthClassName: 'w-40',
      render: (l) => formatCurrency(l.reimbursementamount),
    },
    {
      key: 'servicestatus',
      label: 'Service status',
      widthClassName: 'w-32.5',
      render: (l) => (
        <PillBadge
          variant={
            l.servicestatus === 'completed'
              ? 'info'
              : l.servicestatus === 'active'
                ? 'success'
                : l.servicestatus === 'pending'
                  ? 'warning'
                  : 'error'
          }
        >
          {titleCase(l.servicestatus)}
        </PillBadge>
      ),
    },
    {
      key: 'lgucaseid',
      label: 'Actions',
      widthClassName: 'w-28',
      render: (row) => (
        <button
          type="button"
          onClick={() => setEditing(row)}
          className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer text-sm font-medium"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <>
      <DataTable<GetLguCasesRow, ColumnKey>
        title="LGU reimbursement log"
        countLabel={(total) => `${total} cases`}
        searchPlaceholder="Search by deceased name or case ID..."
        columns={columns}
        bodyOffsetClassName="top-12"
        rowKey={(l) => l.lgucaseid}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters: _filters, ...params }) => getLguCases(params)}
        emptyMessage="No LGU cases match your search."
        loadErrorMessage="Could not load LGU cases. Try again."
        refreshKey={refreshKey}
      />

      {editing && (
        <EditLguCasePanel
          lguCase={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}
