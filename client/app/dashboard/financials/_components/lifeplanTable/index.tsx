'use client';

import { useState } from 'react';
import DataTable from '@/components/dataTable';
import { formatCurrency, titleCase } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import type { GetLifeplansQueryRow } from 'shared';
import { getLifeplans } from '@/services/lifeplansService';
import TransactionHistoryPanel from '../directTable/transactionHistoryPanel';
import RecordTransactionPanel from '../directTable/recordTransactionPanel';
import PillBadge from '@/components/pillBadge';

type ColumnKey = keyof GetLifeplansQueryRow;

export default function LifeplanTable() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyFor, setHistoryFor] = useState<GetLifeplansQueryRow | null>(null);
  const [paymentFor, setPaymentFor] = useState<GetLifeplansQueryRow | null>(null);

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
        l.contractamount != null ? formatCurrency(l.contractamount) : '—',
    },
    {
      key: 'totalamountpaid',
      label: 'Extra paid',
      render: (l) => formatCurrency(l.totalamountpaid),
    },
    {
      key: 'remainingbalance',
      label: 'Extra remaining',
      render: (l) =>
        l.remainingbalance != null ? formatCurrency(l.remainingbalance) : '—',
    },
    {
      key: 'servicestatus',
      label: 'Service status',
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
      key: 'caseid',
      label: 'Actions',
      render: (l) => (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            disabled={l.remainingbalance === null || l.remainingbalance <= 0}
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
      <DataTable<GetLifeplansQueryRow, ColumnKey>
        title="Life plan log"
        countLabel={(total) => `${total} plans`}
        searchPlaceholder="Search by plan holder, number, or company..."
        columns={columns}
        rowKey={(l) => l.planid}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters: _filters, ...params }) => getLifeplans(params)}
        bodyOffsetClassName="top-12"
        emptyMessage="No life plans match your search."
        loadErrorMessage="Could not load life plans. Try again."
        refreshKey={refreshKey}
      />
      {historyFor && (
        <TransactionHistoryPanel
          key={historyFor.caseid}
          caseid={historyFor.caseid}
          deceasedName={historyFor.deceased_name}
          onClose={() => setHistoryFor(null)}
        />
      )}
      {paymentFor && (
        <RecordTransactionPanel
          key={`payment-${paymentFor.caseid}`}
          caseId={paymentFor.caseid}
          deceasedName={paymentFor.deceased_name}
          onClose={() => setPaymentFor(null)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}
