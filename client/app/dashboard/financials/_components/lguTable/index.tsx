'use client';

import DataTable from '@/components/dataTable';
import { formatCurrency, titleCase } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getLguCases, type LguCase } from '@/services/financialService';

type ColumnKey = keyof LguCase;

export default function LguTable() {
  const columns: DataTableColumn<LguCase, ColumnKey>[] = [
    {
      key: 'deceased_name',
      label: 'Deceased name',
      widthClassName: 'w-50',
      cellClassName: 'px-5 py-3 wrap-break-word',
      render: (l) => l.deceased_name,
    },
    {
      key: 'caseid',
      label: 'Case ID',
      widthClassName: 'w-25',
      render: (l) => l.caseid,
    },
    {
      key: 'reimbursementstatus',
      label: 'Reimbursement status',
      widthClassName: 'w-40',
      render: (l) => titleCase(l.reimbursementstatus),
    },
    {
      key: 'reimbursementamount',
      label: 'Reimbursement amount',
      widthClassName: 'w-40',
      render: (l) => formatCurrency(l.reimbursementamount),
    },
  ];

  return (
    <DataTable<LguCase, ColumnKey>
      title="LGU reimbursement log"
      countLabel={(total) => `${total} cases`}
      searchPlaceholder="Search by deceased name or case ID..."
      columns={columns}
      rowKey={(l) => l.lgucaseid}
      defaultSortBy="deceased_name"
      defaultSortOrder="desc"
      fetchData={({ filters: _filters, ...params }) => getLguCases(params)}
      emptyMessage="No LGU cases match your search."
      loadErrorMessage="Could not load LGU cases. Try again."
    />
  );
}