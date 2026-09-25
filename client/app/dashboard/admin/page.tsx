'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import StaffPanel from './_components/staffPanel';
import DataTable from '@/components/dataTable';
import { getStaffList } from '@/services/staffService';
import type { GetStaffRow } from 'shared';
import {
  COLUMNS,
  DEFAULT_FILTERS,
  FILTERS,
  type Filters,
  ColumnKey,
} from './_components/staffTable/constants';
import type { PanelMode } from './_components/staffPanel/types';
import { useInfoModal } from '@/components/infoModal/useInfoModal';

export default function AdminPage() {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { infoModal, showInfo } = useInfoModal();

  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [panelMode, setPanelMode] = useState<PanelMode>('edit');

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
            onClick={() => {
              setPanelMode('create');
              setIsPanelOpen(true);
            }}
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
          onRowClick={(row) => {
            setSelectedStaffId(row.id);
            setPanelMode('edit');
            setIsPanelOpen(true);
          }}
          isRowSelected={(r) => r.id === selectedStaffId}
          emptyMessage="No staff accounts found."
          loadErrorMessage="Could not load staff. Try again."
          refreshKey={refreshKey}
          bodyOffsetClassName="top-12"
        />
      </main>

      {isPanelOpen && (
        <StaffPanel
          mode={panelMode}
          staffId={selectedStaffId}
          onClose={() => setIsPanelOpen(false)}
          onSave={() => setRefreshKey((k) => k + 1)}
          showInfo={showInfo}
        />
      )}
      {infoModal}
    </div>
  );
}
