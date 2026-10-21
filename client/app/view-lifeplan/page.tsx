'use client';

import type { GetLifeplansQueryRow } from 'shared';
import DataTable from '@/components/dataTable';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getMyLifeplans } from '@/services/lifeplansService';
import { formatCurrency } from '@/utils/format';

type ColumnKey = keyof GetLifeplansQueryRow;

const COLUMNS: DataTableColumn<GetLifeplansQueryRow, ColumnKey>[] = [
  {
    key: 'planholdername',
    label: 'Plan holder',
    widthClassName: 'w-45',
    cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
    render: (l) => l.planholdername ?? '—',
  },
  {
    key: 'plannumber',
    label: 'Plan number',
    widthClassName: 'w-35',
    render: (l) => l.plannumber ?? '—',
  },
  {
    key: 'deceased_name',
    label: 'Deceased name',
    widthClassName: 'w-45',
    cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
    render: (l) => l.deceased_name,
  },
  {
    key: 'totalamount',
    label: 'Total amount',
    widthClassName: 'w-35',
    render: (l) =>
      l.totalamount != null ? formatCurrency(l.totalamount) : '—',
  },
];

export default function ViewLifeplanPage() {
  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
            LIFE PLAN AGENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Your life plans
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Life plans belonging to your company.
          </p>
        </div>

        <DataTable<GetLifeplansQueryRow, ColumnKey>
          title="Life plans"
          countLabel={(total) => `${total} plans`}
          searchPlaceholder="Search by plan holder or number..."
          columns={COLUMNS}
          rowKey={(l) => l.planid}
          defaultSortBy="planholdername"
          defaultSortOrder="asc"
          fetchData={({ filters: _filters, ...params }) =>
            getMyLifeplans(params)
          }
          emptyMessage="No life plans found."
          loadErrorMessage="Could not load life plans. Try again."
          bodyOffsetClassName="top-12"
        />
      </main>
    </div>
  );
}
