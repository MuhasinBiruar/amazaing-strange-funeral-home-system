'use client';

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import type { PackageWithCasket } from 'shared';
import DataTable from '@/components/dataTable';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getPackages } from '@/services/packageService';
import { formatCurrency } from '@/utils/format';
import PackagePanel from './packagePanel';

type ColumnKey = 'packagename' | 'packagetype' | 'price' | 'caskettype' | 'manage';

export default function PackagesTab() {
  const [editing, setEditing] = useState<PackageWithCasket | null | undefined>(
    undefined,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: DataTableColumn<PackageWithCasket, ColumnKey>[] = [
    { key: 'packagename', label: 'Package', render: (p) => p.packagename },
    { key: 'packagetype', label: 'Type', render: (p) => p.packagetype },
    { key: 'price', label: 'Price', render: (p) => formatCurrency(p.price) },
    {
      key: 'caskettype',
      label: 'Casket',
      render: (p) => p.caskettype ?? '—',
    },
    {
      key: 'manage',
      label: 'Edit',
      sortable: false,
      exportable: false,
      render: (p) => (
        <button
          type="button"
          onClick={() => setEditing(p)}
          className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
          aria-label={`Edit ${p.packagename}`}
        >
          <Pencil size={15} />
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer"
        >
          <Plus size={16} /> Create package
        </button>
      </div>
      <DataTable<PackageWithCasket, ColumnKey>
        title="Packages"
        exportFileName="packages"
        countLabel={(total) => `${total} packages`}
        searchPlaceholder="Search packages..."
        columns={columns}
        rowKey={(p) => p.packageid}
        deletable={(p) => ({ entitytype: 'package', id: p.packageid })}
        defaultSortBy="packagename"
        defaultSortOrder="asc"
        fetchData={async ({ page, limit, search, sortBy, sortOrder }) => {
          const all = await getPackages();
          const filtered = search
            ? all.filter((p) =>
                `${p.packagename} ${p.packagetype} ${p.caskettype ?? ''}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
            : all;
          const sorted = [...filtered].sort((a, b) => {
            const key = sortBy === 'manage' ? 'packagename' : sortBy;
            const left = a[key];
            const right = b[key];
            const comparison =
              typeof left === 'number' && typeof right === 'number'
                ? left - right
                : String(left ?? '').localeCompare(String(right ?? ''));
            return sortOrder === 'asc' ? comparison : -comparison;
          });
          return {
            data: sorted.slice((page - 1) * limit, page * limit),
            meta: {
              total: sorted.length,
              page,
              limit,
              totalPages: Math.ceil(sorted.length / limit),
            },
          };
        }}
        refreshKey={refreshKey}
        emptyMessage="No packages found."
        loadErrorMessage="Could not load packages. Try again."
      />
      {editing !== undefined && (
        <PackagePanel
          package={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setRefreshKey((key) => key + 1);
          }}
        />
      )}
    </>
  );
}
