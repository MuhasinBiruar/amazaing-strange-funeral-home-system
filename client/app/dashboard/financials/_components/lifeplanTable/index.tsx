'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/dataTable';
import { formatCurrency } from '@/utils/format';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getLifeplans, type Lifeplan } from '@/services/financialService';
import CreateLifeplanPanel from './createLifeplanPanel';
import TransactionHistoryPanel from '../directTable/transactionHistoryPanel';


type ColumnKey = keyof Lifeplan;

export default function LifeplanTable() {
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyFor, setHistoryFor] = useState<Lifeplan | null>(null);


  const columns: DataTableColumn<Lifeplan, ColumnKey>[] = [
    { key: 'planholdername', label: 'Plan holder', widthClassName: 'w-40', cellClassName: 'px-5 py-3 wrap-break-word', render: (l) => l.planholdername },
    { key: 'deceased_name', label: 'Deceased name', widthClassName: 'w-40', cellClassName: 'px-5 py-3 wrap-break-word', render: (l) => l.deceased_name },
    { key: 'plannumber', label: 'Plan number', widthClassName: 'w-30', render: (l) => l.plannumber },
    { key: 'companyname', label: 'Company', widthClassName: 'w-35', cellClassName: 'px-5 py-3 text-gray-500 wrap-break-word', render: (l) => l.companyname },
    { key: 'totalamount', label: 'Total amount', widthClassName: 'w-32.5', render: (l) => formatCurrency(l.totalamount) },
    { key: 'minimumthreshold', label: 'Min. threshold', widthClassName: 'w-32.5', render: (l) => formatCurrency(l.minimumthreshold) },
    { key: 'planid',  label: 'History',  widthClassName: 'w-25',  render: (l) => ( <button type="button" onClick={() => setHistoryFor(l)} className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer text-sm">View history</button>)},
  ];

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition cursor-pointer"
        >
          <Plus size={16} />
          New life plan
        </button>
      </div>

      <DataTable<Lifeplan, ColumnKey>
        title="Life plan log"
        countLabel={(total) => `${total} plans`}
        searchPlaceholder="Search by plan holder, number, or company..."
        columns={columns}
        rowKey={(l) => l.planid}
        defaultSortBy="deceased_name"
        defaultSortOrder="desc"
        fetchData={({ filters: _filters, ...params }) => getLifeplans(params)}
        emptyMessage="No life plans match your search."
        loadErrorMessage="Could not load life plans. Try again."
        refreshKey={refreshKey}
      />

      {isCreating && (
        <CreateLifeplanPanel
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
      {historyFor && (
        <TransactionHistoryPanel
          key={historyFor.planid}
          caseid={historyFor.caseid}
          deceasedName={historyFor.deceased_name}
          onClose={() => setHistoryFor(null)}
        />
      )}
    </>
  );
}