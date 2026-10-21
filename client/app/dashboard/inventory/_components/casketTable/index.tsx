'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  type CasketInventoryTable,
  type GetPaginatedCasketInventoryQuery,
} from 'shared';
import type { DataTableColumn } from '@/components/dataTable/types';
import DataTable from '@/components/dataTable';
import { useInfoModal } from '@/components/infoModal/useInfoModal';
import {
  deleteCasket,
  getPaginatedCasketInventory,
} from '@/services/casketInventoryService';
import PackagesPanel from './packagesPanel';
import DeliveryHistoryPanel from './deliveryHistoryPanel';
import EditCasketPanel from './editCasketPanel';
import FormalinArea from './formalinArea';

/** Sortable columns, plus the unsortable edit/delete column. */
type ColumnKey = GetPaginatedCasketInventoryQuery['sortBy'] | 'manage';

/** Displays casket inventory alongside formalin stock and history controls. */
export default function CasketTable() {
  const [historyFor, setHistoryFor] = useState<CasketInventoryTable[] | null>(
    null,
  );
  const [packagesApartOf, setPackagesApartOf] = useState<
    CasketInventoryTable[] | null
  >(null);
  const [editing, setEditing] = useState<CasketInventoryTable | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { infoModal, showInfo } = useInfoModal();

  async function confirmDelete(casket: CasketInventoryTable) {
    let failure: string | null = null;

    const confirmed = await showInfo({
      title: `Delete ${casket.caskettype}?`,
      message:
        'This removes the casket from inventory. It can only be deleted if no package uses it and it has no delivery or audit history.',
      closeLabel: 'Cancel',
      confirmLabel: 'Delete',
      severity: 'warning',
      // Errors are caught here (rather than thrown) so the reason can be shown
      // in its own modal; a thrown error only keeps this one open silently.
      onConfirmAction: async () => {
        try {
          await deleteCasket(casket.casketid);
        } catch (err) {
          failure =
            err instanceof Error ? err.message : 'Failed to delete casket.';
        }
      },
    });

    if (failure) {
      await showInfo({
        title: "Can't Delete Casket",
        message: failure,
        severity: 'error',
      });
    } else if (confirmed) {
      setRefreshKey((k) => k + 1);
    }
  }

  const columns: DataTableColumn<CasketInventoryTable, ColumnKey>[] = [
    {
      key: 'caskettype',
      label: 'Casket Type',
      widthClassName: 'w-45',
      render: (row) => row.caskettype,
    },
    {
      key: 'manage',
      label: 'Edit / Delete',
      widthClassName: 'w-32',
      sortable: false,
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
          <button
            type="button"
            onClick={() => void confirmDelete(row)}
            aria-label={`Delete ${row.caskettype}`}
            title="Delete casket"
            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 size={15} />
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
      <DataTable<CasketInventoryTable, ColumnKey>
        title="Casket Inventory"
        countLabel={(total) => `${total} caskets in inventory`}
        searchPlaceholder="Search by Casket or Package Name..."
        columns={columns}
        rowKey={(d) => d.casketid}
        defaultSortBy="caskettype"
        defaultSortOrder="desc"
        fetchData={({ filters: _filters, sortBy, ...params }) =>
          getPaginatedCasketInventory({
            ...params,
            // 'manage' is never sortable, so this is only for the type.
            sortBy: sortBy === 'manage' ? 'caskettype' : sortBy,
          })
        }
        refreshKey={refreshKey}
        emptyMessage="No caskets in inventory match your search."
        loadErrorMessage="Could not load casket inventory. Try again."
        bodyOffsetClassName="top-12"
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
      {infoModal}
    </>
  );
}
