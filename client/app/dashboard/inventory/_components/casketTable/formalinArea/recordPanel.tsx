'use client';

import { useState } from 'react';
import type { Case, FormalinInventory } from 'shared';
import { Plus, Minus, Save } from 'lucide-react';
import DataTable from '@/components/dataTable';
import type { DataTableColumn } from '@/components/dataTable/types';
import LoadingButton from '@/components/loadingButton';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import { getCases } from '@/services/caseService';
import {
  addFormalinStock,
  recordFormalinUsage,
} from '@/services/formalinInventoryService';
import { formatDate } from '@/utils/format';

/** Operation currently being recorded against the formalin inventory. */
type Mode = 'add' | 'use';
type CaseColumn =
  | 'deceased_name'
  | 'representative_name'
  | 'managed_by_name'
  | 'total_formalin_used'
  | 'last_formalin_use_date'
  | 'servicestatus';

/**
 * Records a formalin stock addition or usage event.
 *
 * Usage events require a selected case and reduce the current inventory;
 * stock additions increase it. The parent is notified after a successful save
 * so it can refresh the inventory summary and display any threshold warning.
 */
export default function FormalinRecordPanel({
  inventory,
  onClose,
  onSaved,
}: {
  inventory: FormalinInventory;
  onClose: () => void;
  onSaved: (warning: string | null) => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [mode, setMode] = useState<Mode>('add');
  const [quantity, setQuantity] = useState('');
  const [minimumthreshold, setMinimumThreshold] = useState(
    String(inventory.minimumthreshold),
  );
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const caseColumns: DataTableColumn<Case, CaseColumn>[] = [
    {
      key: 'deceased_name',
      label: 'Deceased Name',
      render: (row) => row.deceased_name,
    },
    {
      key: 'representative_name',
      label: 'Representative',
      render: (row) => row.representative_name,
    },
    {
      key: 'managed_by_name',
      label: 'Managed By',
      render: (row) => row.managed_by_name,
    },
    {
      key: 'total_formalin_used',
      label: 'Total Formalin Used',
      render: (row) =>
        row.total_formalin_used > 0
          ? `${row.total_formalin_used} L`
          : 'Not used',
    },
    {
      key: 'last_formalin_use_date',
      label: 'Date of Formalin Use',
      render: (row) => formatDate(row.last_formalin_use_date),
    },
    {
      key: 'servicestatus',
      label: 'Status',
      render: (row) => row.servicestatus,
    },
  ];

  /** Switches between adding stock and recording usage. */
  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setSelectedCase(null);
  }

  /** Validates and persists the currently selected inventory operation. */
  async function submit() {
    const amount = Number(quantity);
    const threshold = Number(minimumthreshold);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a positive quantity in liters.');
      return;
    }
    if (!Number.isFinite(threshold) || threshold < 0) {
      setError('Enter a valid minimum threshold.');
      return;
    }
    if (mode === 'use' && amount > inventory.currentstock) {
      setError('Please update the stock first.');
      return;
    }
    if (mode === 'use' && !selectedCase) {
      setError('Select a case before recording usage.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result =
        mode === 'add'
          ? await addFormalinStock({
              currentstock: amount,
              minimumthreshold: threshold,
            })
          : await recordFormalinUsage({
              quantityused: amount,
              minimumthreshold: threshold,
              caseid: selectedCase!.caseid,
              formalinid: inventory.formalinid,
            });

      onSaved(result.warning);
      requestClose();
    } catch (requestError) {
      const responseData = (
        requestError as {
          response?: { data?: { error?: { message?: string } } };
        }
      ).response?.data;
      setError(
        responseData?.error?.message ?? 'Could not save formalin record.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Record formalin inventory"
      badge="FORMALIN INVENTORY"
      badgeClassName="bg-orange-100 text-orange-800"
      title="Record Formalin"
      subtitle="All quantities are recorded in liters."
      widthClassName="sm:w-5xl"
    >
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <div className="flex rounded-lg border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => selectMode('add')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${mode === 'add' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Plus size={16} /> Add stock
          </button>
          <button
            type="button"
            onClick={() => selectMode('use')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${mode === 'use' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Minus size={16} /> Use formalin
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            {mode === 'add' ? 'Liters to add' : 'Liters used'}
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-indigo-500"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Minimum threshold (liters)
            <input
              type="number"
              min="0"
              step="0.01"
              value={minimumthreshold}
              onChange={(event) => setMinimumThreshold(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-indigo-500"
            />
          </label>
        </div>

        {mode === 'use' && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Select case
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {selectedCase
                  ? `Selected case #${selectedCase.caseid}`
                  : 'Choose the case receiving the formalin.'}
              </p>
            </div>
            <DataTable<Case, CaseColumn>
              title="Cases"
              countLabel={(total) => `${total} cases`}
              searchPlaceholder="Search cases..."
              columns={caseColumns}
              rowKey={(row) => row.caseid}
              defaultSortBy="deceased_name"
              defaultSortOrder="asc"
              onRowClick={setSelectedCase}
              isRowSelected={(row) => row.caseid === selectedCase?.caseid}
              fetchData={({ filters: _filters, ...params }) =>
                getCases({ ...params, sortBy: params.sortBy as never })
              }
              emptyMessage="No cases found."
              loadErrorMessage="Could not load cases. Try again."
              bodyOffsetClassName="top-12"
            />
          </div>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <LoadingButton
          type="button"
          onClick={submit}
          isLoading={isSaving}
          label={mode === 'add' ? 'Record stock addition' : 'Record usage'}
          loadingLabel="Saving..."
          icon={Save}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </SidePanel>
  );
}
