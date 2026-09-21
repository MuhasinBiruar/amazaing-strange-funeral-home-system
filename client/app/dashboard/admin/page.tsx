'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import DataTable from '@/components/dataTable';
import type { DataTableColumn, FilterDef } from '@/components/dataTable/types';
import { accessPageEnum, getAccessPageLabel, type GetStaffRow } from 'shared';
import { getStaffList } from '@/services/staffService';
import StaffPanel from './_components/staffPanel';

type ColumnKey = keyof GetStaffRow;

type Filters = { isActive: boolean | null };

const DEFAULT_FILTERS: Filters = { isActive: null };

const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'select',
    key: 'isActive',
    options: [
      { label: 'All staff', value: null },
      { label: 'Active', value: true },
      { label: 'Inactive', value: false },
    ],
  },
];

const COLUMNS: DataTableColumn<GetStaffRow, ColumnKey>[] = [
  {
    key: 'name',
    label: 'Name',
    widthClassName: 'w-40',
    cellClassName: 'px-5 py-3 font-medium text-gray-900 wrap-break-word',
    render: (r) => r.name,
  },
  {
    key: 'username',
    label: 'Username',
    widthClassName: 'w-32',
    render: (r) => r.username ?? '—',
  },
  {
    key: 'role',
    label: 'Role',
    widthClassName: 'w-24',
    render: (r) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          r.role === 'admin'
            ? 'bg-indigo-100 text-indigo-700'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        {r.role ?? '—'}
      </span>
    ),
  },
  {
    key: 'jobRole',
    label: 'Job role',
    widthClassName: 'w-28',
    render: (r) => r.jobRole,
  },
  {
    key: 'isActive',
    label: 'Active',
    widthClassName: 'w-20',
    render: (r) => (
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          r.isActive ? 'bg-green-500' : 'bg-gray-300'
        }`}
        title={r.isActive ? 'Active' : 'Inactive'}
      />
    ),
  },
  {
    key: 'access',
    label: 'Access',
    widthClassName: 'w-56',
    cellClassName: 'px-5 py-3 text-gray-500 text-left wrap-break-word',
    render: (r) => {
      const enabled = accessPageEnum.options.filter((k) => r.access[k]);
      return enabled.length > 0
        ? enabled.map(getAccessPageLabel).join(', ')
        : '—';
    },
  },
];

export default function AdminPage() {
  const [panelMode, setPanelMode] = useState<'create' | 'edit' | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() {
    setPanelMode('create');
    setSelectedStaffId(null);
  }

  function openEdit(row: GetStaffRow) {
    setPanelMode('edit');
    setSelectedStaffId(row.id);
  }

  function closePanel() {
    setPanelMode(null);
    setSelectedStaffId(null);
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
              ADMIN
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              Staff Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create and manage staff accounts and permissions.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition shrink-0 cursor-pointer"
          >
            <UserPlus size={16} />
            Create Account
          </button>
        </div>

        <DataTable<GetStaffRow, ColumnKey, Filters>
          title="Staff"
          countLabel={(total) => `${total} members`}
          searchPlaceholder="Search staff..."
          filters={FILTERS}
          defaultFilters={DEFAULT_FILTERS}
          columns={COLUMNS}
          rowKey={(r) => r.id}
          defaultSortBy="jobRole"
          defaultSortOrder="asc"
          fetchData={({ filters, ...params }) =>
            getStaffList({
              ...params,
              isActive: filters.isActive ?? undefined,
            })
          }
          onRowClick={openEdit}
          isRowSelected={(r) => r.id === selectedStaffId}
          emptyMessage="No staff accounts found."
          loadErrorMessage="Could not load staff. Try again."
          refreshKey={refreshKey}
          bodyOffsetClassName="top-12"
        />
      </main>

      {panelMode && (
        // TODO: Fix StaffPanel disappearing when closing
        <StaffPanel
          mode={panelMode}
          staffId={selectedStaffId ?? undefined}
          visible={panelMode !== null}
          onHide={closePanel}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
