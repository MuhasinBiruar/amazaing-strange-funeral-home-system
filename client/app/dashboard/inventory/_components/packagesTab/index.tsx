'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { packageSchema, type PackageWithCasket } from 'shared';
import DataTable from '@/components/dataTable';
import type {
  DataTableColumn,
  FilterDef,
  NumberRangeValue,
} from '@/components/dataTable/types';
import { getPackages } from '@/services/packageService';
import { getCasketInventory } from '@/services/casketInventoryService';
import { formatCurrency } from '@/utils/format';
import PackagePanel from './packagePanel';

type ColumnKey = 'packagename' | 'packagetype' | 'price' | 'caskettype' | 'manage';

type Filters = {
  packagetype: PackageWithCasket['packagetype'] | null;
  /** A casket id, `'none'` for packages without a casket, or `null` for all. */
  casket: number | 'none' | null;
  price: NumberRangeValue;
};

const DEFAULT_FILTERS: Filters = {
  packagetype: null,
  casket: null,
  price: { min: null, max: null },
};

function matchesFilters(p: PackageWithCasket, f: Filters) {
  if (f.packagetype && p.packagetype !== f.packagetype) return false;
  if (f.casket === 'none' && p.casketid != null) return false;
  if (typeof f.casket === 'number' && p.casketid !== f.casket) return false;
  if (f.price.min !== null && p.price < f.price.min) return false;
  if (f.price.max !== null && p.price > f.price.max) return false;
  return true;
}

export default function PackagesTab() {
  const [editing, setEditing] = useState<PackageWithCasket | null | undefined>(
    undefined,
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [caskets, setCaskets] = useState<
    { casketid: number; caskettype: string }[]
  >([]);

  useEffect(() => {
    const controller = new AbortController();
    getCasketInventory(controller.signal)
      .then((rows) =>
        setCaskets(
          [...rows].sort((a, b) => a.caskettype.localeCompare(b.caskettype)),
        ),
      )
      .catch((error) => {
        if (!controller.signal.aborted)
          console.error('Failed to load caskets for the filter:', error);
      });
    return () => controller.abort();
  }, [refreshKey]);

  const filters: FilterDef<Filters>[] = [
    {
      type: 'select',
      key: 'packagetype',
      options: [
        { label: 'All types', value: null },
        ...packageSchema.shape.packagetype.options.map((type) => ({
          label: type,
          value: type,
        })),
      ],
    },
    {
      type: 'select',
      key: 'casket',
      options: [
        { label: 'All caskets', value: null },
        ...caskets.map((c) => ({ label: c.caskettype, value: c.casketid })),
        { label: 'No casket', value: 'none' },
      ],
    },
    { type: 'numberRange', key: 'price', label: 'Price', prefix: '₱' },
  ];

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
      <DataTable<PackageWithCasket, ColumnKey, Filters>
        title="Packages"
        exportFileName="packages"
        countLabel={(total) => `${total} packages`}
        searchPlaceholder="Search packages..."
        filters={filters}
        defaultFilters={DEFAULT_FILTERS}
        columns={columns}
        rowKey={(p) => p.packageid}
        deletable={(p) => ({ entitytype: 'package', id: p.packageid })}
        defaultSortBy="packagename"
        defaultSortOrder="asc"
        fetchData={async ({
          page,
          limit,
          search,
          sortBy,
          sortOrder,
          filters: active,
          signal,
        }) => {
          const all = await getPackages(signal);
          const filtered = all.filter(
            (p) =>
              matchesFilters(p, active) &&
              (!search ||
                `${p.packagename} ${p.packagetype} ${p.caskettype ?? ''}`
                  .toLowerCase()
                  .includes(search.toLowerCase())),
          );
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
