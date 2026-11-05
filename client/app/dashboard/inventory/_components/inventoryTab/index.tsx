'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import {
  casketTierEnum,
  type CasketInventoryTable,
  type GetPaginatedCasketInventoryQuery,
} from 'shared';
import type { DataTableColumn, FilterDef } from '@/components/dataTable/types';
import DataTable from '@/components/dataTable';
import { getPaginatedCasketInventory } from '@/services/casketInventoryService';
import PackagesPanel from './packagesPanel';
import DeliveryHistoryPanel from './deliveryHistoryPanel';
import EditCasketPanel from './editCasketPanel';
import FormalinArea from './formalinArea';

/** Sortable columns, plus the unsortable edit column. */
type ColumnKey = GetPaginatedCasketInventoryQuery['sortBy'] | 'manage';

type Filters = {
  tier: string | null;
  lowstock: boolean | null;
};

const DEFAULT_FILTERS: Filters = { tier: null, lowstock: null };

const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'select',
    key: 'tier',
    options: [
      { label: 'All tiers', value: null },
      ...casketTierEnum.options.map((tier) => ({ label: tier, value: tier })),
    ],
  },
  {
    type: 'select',
    key: 'lowstock',
    options: [
      { label: 'All stock levels', value: null },
      { label: 'Low stock', value: true },
      { label: 'In stock', value: false },
    ],
  },
];

/** Displays casket inventory alongside formalin stock and history controls. */
export default function InventoryTab() {
  const [historyFor, setHistoryFor] = useState<CasketInventoryTable[] | null>(
    null,
  );
  const [packagesApartOf, setPackagesApartOf] = useState<
    CasketInventoryTable[] | null
  >(null);
  const [editing, setEditing] = useState<CasketInventoryTable | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: DataTableColumn<CasketInventoryTable, ColumnKey>[] = [
    {
      key: 'caskettype',
      label: 'Casket Type',
      widthClassName: 'w-45',
      render: (row) => row.caskettype,
    },
    {
      key: 'manage',
      label: 'Edit',
      widthClassName: 'w-24',
      sortable: false,
      exportable: false,
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(row)}
            aria-label={`Edit ${row.caskettype}`}
            title="Edit casket"
            className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
          >
            <Pencil size={15} />
          </button>
        </div>
      ),
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
      exportable: false,
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
      <FormalinArea />
      <DataTable<CasketInventoryTable, ColumnKey, Filters>
        title="Casket Inventory"
        exportFileName="casket-inventory"
        countLabel={(total) => `${total} caskets in inventory`}
        searchPlaceholder="Search by Casket or Package Name..."
        filters={FILTERS}
        defaultFilters={DEFAULT_FILTERS}
        columns={columns}
        rowKey={(d) => d.casketid}
        deletable={(d) => ({ entitytype: 'casketinventory', id: d.casketid })}
        defaultSortBy="caskettype"
        defaultSortOrder="desc"
        fetchData={({ filters, sortBy, ...params }) =>
          getPaginatedCasketInventory({
            ...params,
            tier: filters.tier ?? undefined,
            lowstock: filters.lowstock ?? undefined,
            // 'manage' is never sortable, so this is only for the type.
            sortBy: sortBy === 'manage' ? 'caskettype' : sortBy,
          })
        }
        refreshKey={refreshKey}
        emptyMessage="No caskets in inventory match your search."
        loadErrorMessage="Could not load casket inventory. Try again."
        bodyOffsetClassName="top-17.25"
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
      {editing && (
        <EditCasketPanel
          key={editing.casketid}
          casket={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}
