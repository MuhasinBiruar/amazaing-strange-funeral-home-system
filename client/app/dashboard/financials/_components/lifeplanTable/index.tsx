'use client';

import { useState } from 'react';
import DataTable from '@/components/dataTable';
import { formatCurrency, titleCase } from '@/utils/format';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import type { GetLifeplansQueryRow } from 'shared';
import { getLifeplans } from '@/services/lifeplansService';
import TransactionHistoryPanel from '../directTable/transactionHistoryPanel';
import RecordTransactionPanel from '../directTable/recordTransactionPanel';
import ServiceStatusPill from '@/components/serviceStatusPill';

/** What is still unpaid on the extra amount once receipt deductions apply. */
function extraLeft(l: GetLifeplansQueryRow) {
  if (l.contractamount == null) return null;
  return Math.max(l.contractamount - l.totaldeductions - l.totalamountpaid, 0);
}

type ColumnKey = keyof GetLifeplansQueryRow;

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

export default function LifeplanTable() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyFor, setHistoryFor] = useState<GetLifeplansQueryRow | null>(
    null,
  );
  const [paymentFor, setPaymentFor] = useState<GetLifeplansQueryRow | null>(
    null,
  );

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
      cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
      render: (l) => l.companyname,
    },
    {
      key: 'totalamount',
      label: 'Total amount',
      widthClassName: 'w-32.5',
      render: (l) => formatCurrency(l.totalamount),
    },
    {
      key: 'use_benefits',
      label: 'Benefits',
      render: (l) => (l.use_benefits ? 'Used' : 'Upgraded'),
    },
    {
      key: 'contractamount',
      label: 'Extra amount',
      render: (l) =>
        l.contractamount != null
          ? formatCurrency(l.contractamount - l.totaldeductions)
          : '—',
    },
    {
      key: 'totalamountpaid',
      label: 'Extra paid',
      render: (l) => formatCurrency(l.totalamountpaid),
    },
    {
      key: 'remainingbalance',
      label: 'Extra remaining',
      render: (l) => {
        const left = extraLeft(l);
        return left != null ? formatCurrency(left) : '—';
      },
    },
    {
      key: 'servicestatus',
      label: 'Service status',
      widthClassName: 'w-32',
      render: (l) => <ServiceStatusPill status={l.servicestatus} />,
      exportValue: (l) => titleCase(l.servicestatus),
    },
    {
      key: 'caseid',
      label: 'Actions',
      exportable: false,
      render: (l) => (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            disabled={(extraLeft(l) ?? 0) <= 0}
            onClick={() => setPaymentFor(l)}
            className="text-emerald-600 hover:underline disabled:text-gray-300 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
          >
            Record payment
          </button>
          <button
            type="button"
            onClick={() => setHistoryFor(l)}
            className="text-indigo-600 hover:underline cursor-pointer"
          >
            View history
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<GetLifeplansQueryRow, ColumnKey, Filters>
        title="Life plan log"
        exportFileName="life-plans"
        countLabel={(total) => `${total} plans`}
        searchPlaceholder="Search by plan holder, number, or company..."
        filters={FILTERS}
        defaultFilters={DEFAULT_FILTERS}
        columns={columns}
        rowKey={(l) => l.planid}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters, ...params }) =>
          getLifeplans({
            ...params,
            startDate: filters.dateRange.from ?? undefined,
            endDate: filters.dateRange.to ?? undefined,
          })
        }
        bodyOffsetClassName="top-17.25"
        emptyMessage="No life plans match your search."
        loadErrorMessage="Could not load life plans. Try again."
        refreshKey={refreshKey}
      />
      {historyFor && (
        <TransactionHistoryPanel
          key={historyFor.caseid}
          caseid={historyFor.caseid}
          deceasedName={historyFor.deceased_name}
          totalAmount={historyFor.contractamount}
          totalPaid={historyFor.totalamountpaid}
          onClose={() => setHistoryFor(null)}
        />
      )}
      {paymentFor && (
        <RecordTransactionPanel
          key={`payment-${paymentFor.caseid}`}
          caseId={paymentFor.caseid}
          deceasedName={paymentFor.deceased_name}
          totalAmount={paymentFor.contractamount}
          totalPaid={paymentFor.totalamountpaid}
          totalDeductions={paymentFor.totaldeductions}
          onClose={() => setPaymentFor(null)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}
