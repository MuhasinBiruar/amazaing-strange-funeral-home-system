'use client';

import { useState } from 'react';
import type { FormalinUsage, FormalinUsageSummary } from 'shared';
import DataTable from '@/components/dataTable';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import {
  getFormalinUsageBreakdown,
  getFormalinUsageSummary,
} from '@/services/formalinInventoryService';
import { formatDate } from '@/utils/format';

type SummaryColumn = 'usagedate' | 'totalquantityused' | 'actions';
type BreakdownColumn = 'usagedate' | 'casetype' | 'quantityused';

type DateFilters = {
  dateRange: DateRangeValue;
};

/** Formats a date-only API value without allowing timezone conversion to shift it. */
function formatDateKey(dateKey: string) {
  return formatDate(`${dateKey}T12:00:00`);
}

const EMPTY_DATE_FILTERS: DateFilters = {
  dateRange: { from: null, to: null },
};

const DATE_FILTERS: FilterDef<DateFilters>[] = [
  {
    type: 'dateRange',
    key: 'dateRange',
    label: 'Filter by usage date',
  },
];

/**
 * Shows daily formalin usage totals and opens the selected day's detail view.
 */
export default function FormalinUsageHistoryPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [breakdownDate, setBreakdownDate] = useState<string | null>(null);

  const columns: DataTableColumn<FormalinUsageSummary, SummaryColumn>[] = [
    {
      key: 'usagedate',
      label: 'Date',
      render: (row) => formatDateKey(row.usagedate),
    },
    {
      key: 'totalquantityused',
      label: 'Total Quantity Used',
      render: (row) => `${row.totalquantityused} L`,
    },
    {
      key: 'actions',
      label: 'Breakdown',
      render: (row) => (
        <button
          type="button"
          onClick={() => setBreakdownDate(row.usagedate)}
          className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          View Breakdown
        </button>
      ),
    },
  ];

  return (
    <>
      <SidePanel
        shown={isShown}
        onRequestClose={requestClose}
        ariaLabel="Formalin usage history"
        badge="FORMALIN USAGE"
        badgeClassName="bg-orange-100 text-orange-800"
        title="Usage History"
        subtitle="Daily formalin usage summaries, newest first."
        widthClassName="sm:w-3xl"
      >
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <DataTable<FormalinUsageSummary, SummaryColumn, DateFilters>
            title="Summarized usage records"
            countLabel={(total) => `${total} dates`}
            filters={DATE_FILTERS}
            defaultFilters={EMPTY_DATE_FILTERS}
            columns={columns}
            rowKey={(row) => row.usagedate}
            defaultSortBy="usagedate"
            defaultSortOrder="desc"
            fetchData={({ filters, ...params }) =>
              getFormalinUsageSummary({
                ...params,
                startDate: filters.dateRange.from ?? undefined,
                endDate: filters.dateRange.to ?? undefined,
              })
            }
            emptyMessage="No formalin usage recorded."
            loadErrorMessage="Could not load usage history. Try again."
            bodyOffsetClassName="top-17.25"
          />
        </div>
      </SidePanel>

      {breakdownDate && (
        <FormalinUsageBreakdownPanel
          key={breakdownDate}
          date={breakdownDate}
          onClose={() => setBreakdownDate(null)}
        />
      )}
    </>
  );
}

/** Displays individual formalin usage records for one calendar date. */
function FormalinUsageBreakdownPanel({
  date,
  onClose,
}: {
  date: string;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const columns: DataTableColumn<FormalinUsage, BreakdownColumn>[] = [
    {
      key: 'usagedate',
      label: 'Date',
      render: () => formatDateKey(date),
    },
    {
      key: 'casetype',
      label: 'Case Type',
      render: (row) => row.casetype ?? '—',
    },
    {
      key: 'quantityused',
      label: 'Quantity Used',
      render: (row) => `${row.quantityused} L`,
    },
  ];

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Formalin usage breakdown"
      badge="FORMALIN USAGE"
      badgeClassName="bg-orange-100 text-orange-800"
      title="Usage Breakdown"
      subtitle={`Individual records for ${formatDateKey(date)}.`}
      widthClassName="sm:w-3xl"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <DataTable<FormalinUsage, BreakdownColumn>
          title="Usage records"
          countLabel={(total) => `${total} records`}
          columns={columns}
          rowKey={(row) => row.usageid}
          defaultSortBy="usagedate"
          defaultSortOrder="desc"
          fetchData={(params) =>
            getFormalinUsageBreakdown({
              ...params,
              startDate: date,
              endDate: date,
            })
          }
          emptyMessage="No formalin usage recorded for this date."
          loadErrorMessage="Could not load usage breakdown. Try again."
          bodyOffsetClassName="top-17.25"
        />
      </div>
    </SidePanel>
  );
}
