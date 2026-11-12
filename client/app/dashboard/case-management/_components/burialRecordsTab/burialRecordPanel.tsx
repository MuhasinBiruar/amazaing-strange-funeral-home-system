'use client';

import { useState } from 'react';
import type { BurialRecord, Case } from 'shared';
import {
  createBurialRecordQuerySchema,
  updateBurialRecordQuerySchema,
} from 'shared';
import SidePanel from '@/components/sidePanel';
import LoadingButton from '@/components/loadingButton';
import DataTable from '@/components/dataTable';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import { fieldClass, labelClass } from '@/components/formStyles';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import { getCases } from '@/services/caseService';
import {
  createBurialRecord,
  updateBurialRecord,
} from '@/services/burialRecordService';
import { toDateInputValue } from '@/utils/toDateInputValue';
import { formatDate } from '@/utils/format';
import ServiceStatusPill from '@/components/serviceStatusPill';
import PlanTypePill from '@/components/planTypePill';

type CaseColumn =
  | 'deceased_name'
  | 'representative_name'
  | 'managed_by_name'
  | 'servicestatus'
  | 'plantype';

type CaseFilters = {
  status: Case['servicestatus'] | null;
  plantype: Case['plantype'] | null;
  dateRange: DateRangeValue;
};

const DEFAULT_CASE_FILTERS: CaseFilters = {
  status: null,
  plantype: null,
  dateRange: { from: null, to: null },
};

const CASE_FILTERS: FilterDef<CaseFilters>[] = [
  {
    type: 'select',
    key: 'status',
    options: [
      { label: 'All statuses', value: null },
      { label: 'Intake', value: 'intake' },
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
      { label: 'Completed', value: 'completed' },
    ],
  },
  {
    type: 'select',
    key: 'plantype',
    options: [
      { label: 'All plan types', value: null },
      { label: 'Direct', value: 'Direct' },
      { label: 'Life Plan', value: 'Life' },
      { label: 'LGU', value: 'LGU' },
    ],
  },
  {
    type: 'dateRange',
    key: 'dateRange',
    label: 'Filter by date created',
  },
];

export default function BurialRecordPanel({
  record,
  onClose,
  onSaved,
}: {
  record: BurialRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [burialdate, setBurialdate] = useState(
    record ? toDateInputValue(record.burialdate) : '',
  );
  const [burialsite, setBurialsite] = useState(record?.burialsite ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function selectCase(item: Case) {
    setSelectedCase(item);
    setBurialdate(toDateInputValue(item.burialdatedeadline));
    setError(null);
  }

  const caseColumns: DataTableColumn<Case, CaseColumn>[] = [
    {
      key: 'deceased_name',
      label: 'Deceased name',
      render: (item) => item.deceased_name,
    },
    {
      key: 'representative_name',
      label: 'Representative',
      render: (item) => item.representative_name,
    },
    {
      key: 'managed_by_name',
      label: 'Managed by',
      render: (item) => item.managed_by_name,
    },
    {
      key: 'servicestatus',
      label: 'Status',
      render: (item) => <ServiceStatusPill status={item.servicestatus} />,
      exportValue: (item) => item.servicestatus,
    },
    {
      key: 'plantype',
      label: 'Plan type',
      render: (item) => <PlanTypePill plantype={item.plantype} />,
      exportValue: (item) => item.plantype,
    },
  ];

  async function save() {
    const common = {
      burialdate: burialdate || null,
      burialsite: burialsite.trim() || null,
    };
    setSaving(true);
    setError(null);
    try {
      if (record) {
        const parsed = updateBurialRecordQuerySchema.safeParse(common);
        if (!parsed.success) {
          setError(
            parsed.error.issues[0]?.message ?? 'Check the burial fields.',
          );
          setSaving(false);
          return;
        }
        await updateBurialRecord(record.burialid, parsed.data);
      } else {
        const parsed = createBurialRecordQuerySchema.safeParse({
          ...common,
          caseid: selectedCase?.caseid,
        });
        if (!parsed.success) {
          setError(
            parsed.error.issues[0]?.message ?? 'Check the burial fields.',
          );
          setSaving(false);
          return;
        }
        await createBurialRecord(parsed.data);
      }
      onSaved();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not save burial record.',
      );
      setSaving(false);
    }
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={record ? 'Edit burial record' : 'Create burial record'}
      badge={record ? 'EDIT BURIAL RECORD' : 'NEW BURIAL RECORD'}
      title={record ? record.deceased_name : 'Record Burial'}
      widthClassName={record ? 'sm:w-md' : 'sm:w-5xl'}
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {!record && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Select case
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {selectedCase
                  ? `Selected: ${selectedCase.deceased_name}`
                  : 'Choose the case for this burial record.'}
              </p>
            </div>
            <DataTable<Case, CaseColumn, CaseFilters>
              title="Cases"
              countLabel={(total) => `${total} cases`}
              searchPlaceholder="Search cases..."
              filters={CASE_FILTERS}
              defaultFilters={DEFAULT_CASE_FILTERS}
              columns={caseColumns}
              rowKey={(item) => item.caseid}
              defaultSortBy="deceased_name"
              defaultSortOrder="asc"
              onRowClick={selectCase}
              isRowSelected={(item) =>
                item.caseid === selectedCase?.caseid
              }
              fetchData={({ filters, ...params }) =>
                getCases({
                  ...params,
                  sortBy: params.sortBy as never,
                  status: filters.status ?? undefined,
                  plantype: filters.plantype ?? undefined,
                  startDate: filters.dateRange.from ?? undefined,
                  endDate: filters.dateRange.to ?? undefined,
                })
              }
              emptyMessage="No cases found."
              loadErrorMessage="Could not load cases. Try again."
              bodyOffsetClassName="top-12"
            />
            {selectedCase && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Selected case burial date
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  {formatDate(selectedCase.burialdatedeadline)}
                </p>
              </div>
            )}
          </div>
        )}
        <div>
          <label htmlFor="burial-date" className={labelClass}>
            Burial date <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="burial-date"
            type="date"
            value={burialdate}
            onChange={(event) => setBurialdate(event.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="burial-site" className={labelClass}>
            Burial site <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="burial-site"
            value={burialsite}
            onChange={(event) => setBurialsite(event.target.value)}
            className={fieldClass}
            placeholder="e.g. Manila North Cemetery"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={requestClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <LoadingButton
            type="button"
            isLoading={saving}
            onClick={() => void save()}
            label={record ? 'Save changes' : 'Create record'}
            loadingLabel="Saving..."
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          />
        </div>
      </div>
    </SidePanel>
  );
}
