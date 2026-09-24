'use client';

import { useState } from 'react';
import { type CasketInventoryTable } from 'shared';
import type { DataTableColumn } from '@/components/dataTable/types';
import DataTable from '@/components/dataTable';
import { getPaginatedCasketInventory } from '@/services/casketInventoryService';
import PackagesPanel from './packages-panel';
import DeliveryHistoryPanel from './delivery-history-panel';
type ColumnKey = keyof CasketInventoryTable;

/**
 *
 * @TODO add filter by package type
 *       add side panel for delivery history of casket
 *       add formalin inventory management
 */

export default function CasketTable() {
  const [historyFor, setHistoryFor] = useState<CasketInventoryTable[] | null>(
    null,
  );
  const [packagesApartOf, setPackagesApartOf] = useState<
    CasketInventoryTable[] | null
  >(null);
  const [refreshKey] = useState(0);

  const columns: DataTableColumn<CasketInventoryTable, ColumnKey>[] = [
    {
      key: 'caskettype',
      label: 'Casket Type',
      widthClassName: 'w-45',
      render: (row) => row.caskettype,
    },
    {
      key: 'currentstock',
      label: 'Current Stock',
      widthClassName: 'w-45',
      render: (row) => row.currentstock,
    },
    {
      key: 'casketid',
      label: 'Actions',
      widthClassName: 'w-45',
      render: (row) => (
        <div className="flex items-center justify-center gap-6 whitespace-nowrap">
          <button
            onClick={() => setPackagesApartOf([row])}
            className="text-blue-500 hover:text-blue-700 hover:cursor-pointer"
          >
            View Packages
          </button>
          <button
            onClick={() => setHistoryFor([row])}
            className="text-blue-500 hover:text-blue-700 hover:cursor-pointer"
          >
            View Delivery History
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <section className="space-y-2 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">Formalin Area</h2>
        <p className="mt-1 text-sm text-gray-500">
          Formalin Inventory management will be available here.
        </p>
      </section>
      <DataTable<CasketInventoryTable, ColumnKey>
        key={refreshKey}
        title="Casket Inventory"
        countLabel={(total) => `${total} caskets in inventory`}
        searchPlaceholder="Search by Casket or Package Name..."
        columns={columns}
        rowKey={(d) => d.casketid}
        defaultSortBy="caskettype"
        defaultSortOrder="desc"
        fetchData={({ filters: _filters, ...params }) =>
          getPaginatedCasketInventory(params)
        }
        emptyMessage="No caskets in inventory match your search."
        loadErrorMessage="Could not load casket inventory. Try again."
      />
      {packagesApartOf?.[0] && (
        <PackagesPanel
          casketid={packagesApartOf[0].casketid}
          caskettype={packagesApartOf[0].caskettype}
          onClose={() => setPackagesApartOf(null)}
        />
      )}
      {historyFor?.[0] && (
        <DeliveryHistoryPanel
          casketid={historyFor[0].casketid}
          caskettype={historyFor[0].caskettype}
          onClose={() => setHistoryFor(null)}
        />
      )}
    </>
  );
}
