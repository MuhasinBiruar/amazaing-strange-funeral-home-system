'use client';

import type { GetLguCasesRow } from 'shared';
import DataTable from '@/components/dataTable';
import type {
  DataTableColumn,
  DateRangeValue,
} from '@/components/dataTable/types';
import ReimbursementStatusPill from '@/components/reimbursementStatusPill';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import { getLguCases } from '@/services/lguCasesService';
import { formatCurrency, formatDate } from '@/utils/format';

type ColumnKey = keyof GetLguCasesRow;

const COLUMNS: DataTableColumn<GetLguCasesRow, ColumnKey>[] = [
  {
    key: 'deceased_name',
    label: 'Deceased Name',
    widthClassName: 'w-50',
    cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
    render: (l) => l.deceased_name,
  },
  {
    key: 'reimbursementstatus',
    label: 'Reimbursement Status',
    widthClassName: 'w-40',
    render: (l) => <ReimbursementStatusPill status={l.reimbursementstatus} />,
  },
  {
    key: 'reimbursementamount',
    label: 'Reimbursement Amount',
    widthClassName: 'w-40',
    render: (l) => formatCurrency(l.reimbursementamount),
  },
];

/**
 * Lists the LGU cases behind an LGU's "Total Records" count, limited to the
 * same date range (by `deceasedrecord.datecreated`) the count was taken over.
 */
export default function LguRecordsPanel({
  lguid,
  lguname,
  dateRange,
  onClose,
}: {
  lguid: number;
  lguname: string;
  dateRange: DateRangeValue;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={`LGU records for ${lguname}`}
      badge="LGU RECORDS"
      title={lguname}
      subtitle={
        dateRange.from && dateRange.to
          ? `Cases created ${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`
          : 'All dates'
      }
      widthClassName="sm:w-3xl"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <DataTable<GetLguCasesRow, ColumnKey>
          title="Records"
          countLabel={(total) => `${total} records`}
          searchPlaceholder="Search name or status..."
          columns={COLUMNS}
          rowKey={(l) => l.lgucaseid}
          defaultSortBy="lgucaseid"
          defaultSortOrder="desc"
          fetchData={({ filters: _filters, ...params }) =>
            getLguCases({
              ...params,
              lguid,
              startDate: dateRange.from ?? undefined,
              endDate: dateRange.to ?? undefined,
            })
          }
          emptyMessage="No LGU records for this LGU in this date range."
          loadErrorMessage="Could not load LGU records. Try again."
          bodyOffsetClassName="top-12"
        />
      </div>
    </SidePanel>
  );
}
