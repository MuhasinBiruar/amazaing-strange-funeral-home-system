'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/dataTable';
import { formatCurrency, titleCase } from '@/utils/format';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import type { GetLifeplansQueryRow } from 'shared';
import type { PaymentStatus } from 'shared/utils';
import {
  getLifeplanCompanies,
  getLifeplans,
} from '@/services/lifeplansService';
import TransactionHistoryPanel from '../directTable/transactionHistoryPanel';
import RecordTransactionPanel from '../directTable/recordTransactionPanel';
import ServiceStatusPill from '@/components/serviceStatusPill';
import ServiceStatusLegend from '@/components/serviceStatusLegend';

/** What is still unpaid on the extra amount once receipt deductions apply. */
function extraLeft(l: GetLifeplansQueryRow) {
  if (l.contractamount == null) return null;
  return Math.max(l.contractamount - l.totalamountpaid, 0);
}

type ColumnKey = keyof GetLifeplansQueryRow;

type Filters = {
  companyid: number | null;
  use_benefits: boolean | null;
  status: GetLifeplansQueryRow['servicestatus'] | null;
  paymentstatus: PaymentStatus | null;
  dateRange: DateRangeValue;
};

const DEFAULT_FILTERS: Filters = {
  companyid: null,
  use_benefits: null,
  status: null,
  paymentstatus: null,
  dateRange: { from: null, to: null },
};

function getFilters(
  companies: { companyid: number; companyname: string }[],
): FilterDef<Filters>[] {
  return [
    {
      type: 'select',
      key: 'companyid',
      options: [
        { label: 'All companies', value: null },
        ...companies.map((c) => ({ label: c.companyname, value: c.companyid })),
      ],
    },
    {
      type: 'select',
      key: 'use_benefits',
      options: [
        { label: 'All plans', value: null },
        { label: 'Uses benefits', value: true },
        { label: 'Upgraded package', value: false },
      ],
    },
    {
      type: 'select',
      key: 'status',
      options: [
        { label: 'All statuses', value: null },
        { label: 'Intake', value: 'intake' },
        { label: 'Active', value: 'active' },
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      type: 'select',
      key: 'paymentstatus',
      options: [
        { label: 'All payments', value: null },
        { label: 'Fully paid', value: 'paid' },
        { label: 'With balance', value: 'outstanding' },
        { label: 'No contract yet', value: 'nocontract' },
      ],
    },
    {
      type: 'dateRange',
      key: 'dateRange',
      label: 'Filter by date created',
    },
  ];
}

export default function LifeplanTable({
  initialSearch,
}: {
  /** Prefills the search, e.g. from a notification link. */
  initialSearch?: string;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyFor, setHistoryFor] = useState<GetLifeplansQueryRow | null>(
    null,
  );
  const [paymentFor, setPaymentFor] = useState<GetLifeplansQueryRow | null>(
    null,
  );
  const [companies, setCompanies] = useState<
    { companyid: number; companyname: string }[]
  >([]);

  // Options for the company filter. 100 is the API's page limit, far above
  // the number of life plan companies a funeral home deals with.
  useEffect(() => {
    const controller = new AbortController();
    getLifeplanCompanies({
      page: 1,
      limit: 100,
      sortBy: 'companyname',
      sortOrder: 'asc',
      signal: controller.signal,
    })
      .then((res) => setCompanies(res.data))
      .catch((error) => {
        if (!controller.signal.aborted)
          console.error('Failed to load companies for the filter:', error);
      });
    return () => controller.abort();
  }, []);

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
      key: 'originalprice',
      label: 'Original Package Price',
      widthClassName: 'w-32.5',
      render: (l) =>
        l.originalprice != null ? formatCurrency(l.originalprice) : '—',
    },
    {
      key: 'contractamount',
      label: 'Extra balance',
      render: (l) =>
        l.contractamount != null ? formatCurrency(l.contractamount) : '—',
    },
    {
      key: 'totalamountpaid',
      label: 'Extra paid',
      render: (l) => formatCurrency(l.totalamountpaid),
    },
    {
      key: 'remainingbalance',
      label: 'Outstanding Balance',
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
        initialSearch={initialSearch}
        filters={getFilters(companies)}
        defaultFilters={DEFAULT_FILTERS}
        columns={columns}
        rowKey={(l) => l.planid}
        deletable={(l) => ({ entitytype: 'case', id: l.caseid })}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters, ...params }) =>
          getLifeplans({
            ...params,
            companyid: filters.companyid ?? undefined,
            use_benefits: filters.use_benefits ?? undefined,
            status: filters.status ?? undefined,
            paymentstatus: filters.paymentstatus ?? undefined,
            startDate: filters.dateRange.from ?? undefined,
            endDate: filters.dateRange.to ?? undefined,
          })
        }
        bodyOffsetClassName="top-17.25"
        emptyMessage="No life plans match your search."
        legend={<ServiceStatusLegend plans={['Life']} />}
        loadErrorMessage="Could not load life plans. Try again."
        refreshKey={refreshKey}
      />
      {historyFor && (
        <TransactionHistoryPanel
          key={historyFor.caseid}
          caseid={historyFor.caseid}
          deceasedName={historyFor.deceased_name}
          representativeName={historyFor.representative_name}
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
          representativeName={paymentFor.representative_name}
          totalAmount={paymentFor.contractamount}
          totalPaid={paymentFor.totalamountpaid}
          onClose={() => setPaymentFor(null)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}
