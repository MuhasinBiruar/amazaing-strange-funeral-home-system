'use client';

import { useState } from 'react';
import type { GetRepresentativesRow } from 'shared';
import DataTable from '@/components/dataTable';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import { getRepresentatives } from '@/services/representativeService';
import { formatDate } from '@/utils/format';
import RepresentativeCasesPanel from './representativeCasesPanel';

type ColumnKey =
  'lastname' | 'firstname' | 'middlename' | 'datecreated' | 'case_count';

type Filters = { dateRange: DateRangeValue };

const DEFAULT_FILTERS: Filters = { dateRange: { from: null, to: null } };

const FILTERS: FilterDef<Filters>[] = [
  { type: 'dateRange', key: 'dateRange', label: 'Filter by date created' },
];

/** "Last, First Middle", the way the picker lists names. */
export function representativeLabel(r: GetRepresentativesRow) {
  return `${r.lastname}, ${[r.firstname, r.middlename].filter(Boolean).join(' ')}`;
}

/**
 * Picks an existing representative for a new case. Clicking a row selects
 * it; "Show cases" opens the cases they already represent.
 */
export default function ExistingRepresentativePicker({
  selectedId,
  onSelect,
}: {
  selectedId: number | null;
  onSelect: (representative: GetRepresentativesRow) => void;
}) {
  const [viewing, setViewing] = useState<GetRepresentativesRow | null>(null);

  const columns: DataTableColumn<GetRepresentativesRow, ColumnKey>[] = [
    {
      key: 'lastname',
      label: 'Last name',
      cellClassName: 'px-4 py-3 text-gray-900 wrap-break-word',
      render: (r) => r.lastname,
    },
    {
      key: 'firstname',
      label: 'First name',
      cellClassName: 'px-4 py-3 text-gray-700 wrap-break-word',
      render: (r) => r.firstname,
    },
    {
      key: 'middlename',
      label: 'Middle name',
      cellClassName: 'px-4 py-3 text-gray-700 wrap-break-word',
      render: (r) => r.middlename || <span className="text-gray-400">—</span>,
      exportValue: (r) => r.middlename ?? '',
    },
    {
      key: 'datecreated',
      label: 'Date created',
      cellClassName: 'px-4 py-3 text-gray-500 whitespace-nowrap',
      render: (r) => formatDate(r.datecreated),
    },
    {
      key: 'case_count',
      label: 'Show cases representing',
      cellClassName: 'px-4 py-3 whitespace-nowrap',
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // don't select the row
            setViewing(r);
          }}
          className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
        >
          Show cases ({r.case_count})
        </button>
      ),
      exportValue: (r) => r.case_count,
    },
  ];

  return (
    <>
      <DataTable<GetRepresentativesRow, ColumnKey, Filters>
        title="Representatives"
        countLabel={(total) =>
          `${total} ${total === 1 ? 'representative' : 'representatives'}`
        }
        searchPlaceholder="Search name or contact no..."
        filters={FILTERS}
        defaultFilters={DEFAULT_FILTERS}
        columns={columns}
        rowKey={(r) => r.representativeid}
        onRowClick={onSelect}
        isRowSelected={(r) => r.representativeid === selectedId}
        defaultSortBy="lastname"
        defaultSortOrder="asc"
        pageSize={8}
        fetchData={({ filters, ...params }) =>
          getRepresentatives({
            ...params,
            startDate: filters.dateRange.from ?? undefined,
            endDate: filters.dateRange.to ?? undefined,
          })
        }
        emptyMessage="No representatives match your search."
        loadErrorMessage="Could not load representatives. Try again."
      />

      {viewing && (
        <RepresentativeCasesPanel
          representativeid={viewing.representativeid}
          name={[viewing.firstname, viewing.middlename, viewing.lastname]
            .filter(Boolean)
            .join(' ')}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}
