'use client';

import type { GetLifeplansQueryRow } from 'shared';
import DataTable from '@/components/dataTable';
import type {
  DataTableColumn,
  DateRangeValue,
} from '@/components/dataTable/types';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import { getLifeplans } from '@/services/lifeplansService';
import { formatCurrency, formatDate } from '@/utils/format';

type ColumnKey = keyof GetLifeplansQueryRow;

const COLUMNS: DataTableColumn<GetLifeplansQueryRow, ColumnKey>[] = [
  {
    key: 'deceased_name',
    label: 'Deceased Name',
    widthClassName: 'w-50',
    cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
    render: (p) => p.deceased_name,
  },
  {
    key: 'planholdername',
    label: 'Planholder',
    widthClassName: 'w-45',
    cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
    render: (p) => p.planholdername ?? '—',
  },
  {
    key: 'plannumber',
    label: 'Plan Number',
    widthClassName: 'w-37.5',
    render: (p) => p.plannumber ?? '—',
  },
  {
    key: 'totalamount',
    label: 'Total Amount',
    widthClassName: 'w-37.5',
    render: (p) =>
      p.totalamount === null ? '—' : formatCurrency(p.totalamount),
  },
  {
    key: 'datecreated',
    label: 'Date',
    widthClassName: 'w-35',
    render: (p) => formatDate(p.datecreated),
  },
];

/**
 * Lists the life plans behind a company's "Total Plans" count, limited to the
 * same date range (by `deceasedrecord.datecreated`) the count was taken over.
 */
export default function LifeplanRecordsPanel({
  companyid,
  companyname,
  dateRange,
  onClose,
}: {
  companyid: number;
  companyname: string;
  dateRange: DateRangeValue;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={`Life plan records for ${companyname}`}
      badge="LIFE PLAN RECORDS"
      title={companyname}
      subtitle={
        dateRange.from && dateRange.to
          ? `Cases created ${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`
          : 'All dates'
      }
      widthClassName="sm:w-4xl"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <DataTable<GetLifeplansQueryRow, ColumnKey>
          title="Plans"
          countLabel={(total) => `${total} plans`}
          searchPlaceholder="Search name or plan number..."
          columns={COLUMNS}
          rowKey={(p) => p.planid}
          defaultSortBy="datecreated"
          defaultSortOrder="desc"
          fetchData={({ filters: _filters, ...params }) =>
            getLifeplans({
              ...params,
              companyid,
              startDate: dateRange.from ?? undefined,
              endDate: dateRange.to ?? undefined,
            })
          }
          emptyMessage="No life plans for this company in this date range."
          loadErrorMessage="Could not load life plans. Try again."
          bodyOffsetClassName="top-12"
        />
      </div>
    </SidePanel>
  );
}
