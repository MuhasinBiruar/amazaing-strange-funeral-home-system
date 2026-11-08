'use client';

import { useState } from 'react';
import { ArchiveRestore, Loader2 } from 'lucide-react';
import {
  DELETION_ENTITY_LABELS,
  DELETION_RETENTION_DAYS,
  deletionEntityTypeEnum,
  type DeletionEntityType,
  type DeletionLog,
} from 'shared';
import DataTable from '@/components/dataTable';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import PillBadge, { type BadgeVariant } from '@/components/pillBadge';
import { useInfoModal } from '@/components/infoModal/useInfoModal';
import { getDeletions, restoreDeletions } from '@/services/deletionService';
import { formatDate } from '@/utils/format';

type ColumnKey = keyof DeletionLog | 'restore';

type Filters = {
  entitytype: DeletionEntityType | null;
  dateRange: DateRangeValue;
};

const DEFAULT_FILTERS: Filters = {
  entitytype: null,
  dateRange: { from: null, to: null },
};

/** E.g. "Casket delivery". */
function typeLabel(entitytype: DeletionEntityType) {
  const { singular } = DELETION_ENTITY_LABELS[entitytype];
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'select',
    key: 'entitytype',
    options: [
      { label: 'All types', value: null },
      ...deletionEntityTypeEnum.options.map((type) => ({
        label: typeLabel(type),
        value: type,
      })),
    ],
  },
  {
    type: 'dateRange',
    key: 'dateRange',
    label: 'Filter by date deleted',
  },
];

/** Grouped by the page each type comes from. */
const TYPE_VARIANTS: Record<DeletionEntityType, BadgeVariant> = {
  case: 'indigo',
  package: 'indigo',
  burialrecord: 'indigo',
  expense: 'purple',
  casketdelivery: 'info',
  formalindelivery: 'info',
  formalinusage: 'info',
  casketinventory: 'info',
  inventoryaudit: 'info',
  lgu: 'success',
  lifeplancompany: 'success',
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days until an entry is permanently deleted. */
function daysLeft(purgeafter: Date) {
  return Math.max(0, Math.ceil((purgeafter.getTime() - Date.now()) / DAY_MS));
}

function daysLeftLabel(days: number) {
  if (days <= 1) return 'Less than a day';
  return `${days} days`;
}

export default function DeletedItemsPage() {
  const { infoModal, showInfo } = useInfoModal();
  const [restoringIds, setRestoringIds] = useState<Set<number>>(
    () => new Set(),
  );

  /** Restores entries, then reports anything that couldn't go back. */
  async function restore(entries: DeletionLog[], onDone: () => void) {
    const ids = entries.map((entry) => entry.deletionid);
    setRestoringIds((prev) => new Set([...prev, ...ids]));

    try {
      const result = await restoreDeletions(ids);
      onDone();

      const restored = result.succeeded.length;
      if (result.failed.length === 0) {
        await showInfo({
          title: 'Restored',
          message:
            restored === 1
              ? `${result.succeeded[0].label} is back where it was.`
              : `${restored} items are back where they were.`,
          severity: 'success',
        });
      } else {
        await showInfo({
          title:
            restored === 0
              ? "Couldn't restore"
              : `${result.failed.length} couldn't be restored`,
          message:
            restored === 0
              ? 'Nothing was restored:'
              : `${restored} restored, but these couldn't be:`,
          items: result.failed.map((failure) => failure.message),
          itemIcon: ArchiveRestore,
          severity: restored === 0 ? 'error' : 'warning',
        });
      }
    } catch (error) {
      await showInfo({
        title: "Couldn't restore",
        message: error instanceof Error ? error.message : 'Try again.',
        severity: 'error',
      });
    } finally {
      setRestoringIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  }

  async function restoreAll(
    total: number,
    loadAllRows: () => Promise<DeletionLog[]>,
    onDone: () => void,
  ) {
    const confirmed = await showInfo({
      title: 'Restore all deleted items?',
      message: `This will restore all ${total} items matching the current search and filters.`,
      closeLabel: 'Cancel',
      confirmLabel: 'Restore all',
      severity: 'warning',
    });
    if (!confirmed) return;

    let entries: DeletionLog[];
    try {
      entries = await loadAllRows();
    } catch (error) {
      await showInfo({
        title: "Couldn't load deleted items",
        message: error instanceof Error ? error.message : 'Try again.',
        severity: 'error',
      });
      return;
    }
    if (entries.length === 0) {
      await showInfo({
        title: 'Nothing to restore',
        message: 'There are no deleted items matching the current search and filters.',
        severity: 'info',
      });
      return;
    }

    await restore(entries, onDone);
  }

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  const columns: DataTableColumn<DeletionLog, ColumnKey>[] = [
    {
      key: 'label',
      label: 'Item',
      widthClassName: 'w-60',
      cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
      render: (d) => d.label,
    },
    {
      key: 'entitytype',
      label: 'Type',
      widthClassName: 'w-37.5',
      render: (d) => (
        <PillBadge variant={TYPE_VARIANTS[d.entitytype]}>
          {typeLabel(d.entitytype)}
        </PillBadge>
      ),
      exportValue: (d) => typeLabel(d.entitytype),
    },
    {
      key: 'summary',
      label: 'Deleted with it',
      widthClassName: 'w-60',
      cellClassName: 'px-5 py-3 text-gray-500 wrap-break-word',
      render: (d) => d.summary ?? '—',
    },
    {
      key: 'deletedby_name',
      label: 'Deleted by',
      widthClassName: 'w-40',
      cellClassName: 'px-5 py-3 text-gray-500 wrap-break-word',
      render: (d) => d.deletedby_name || '—',
    },
    {
      key: 'deletedat',
      label: 'Date deleted',
      widthClassName: 'w-32.5',
      render: (d) => formatDate(d.deletedat),
    },
    {
      key: 'purgeafter',
      label: 'Time left',
      widthClassName: 'w-32.5',
      render: (d) => {
        const days = daysLeft(d.purgeafter);
        return (
          <PillBadge
            variant={days <= 3 ? 'error' : days <= 7 ? 'warning' : 'gray'}
          >
            {daysLeftLabel(days)}
          </PillBadge>
        );
      },
      exportValue: (d) => daysLeftLabel(daysLeft(d.purgeafter)),
    },
    {
      key: 'restore',
      label: 'Restore',
      widthClassName: 'w-30',
      sortable: false,
      exportable: false,
      render: (d) => {
        const isRestoring = restoringIds.has(d.deletionid);
        return (
          <button
            type="button"
            onClick={() => void restore([d], refresh)}
            disabled={isRestoring}
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestoring ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ArchiveRestore size={13} />
            )}
            Restore
          </button>
        );
      },
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
            ADMIN
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Deleted Items
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Deleted records stay here for {DELETION_RETENTION_DAYS} days.
            Restoring one puts it back exactly as it was. After{' '}
            {DELETION_RETENTION_DAYS} days it&apos;s permanently deleted.
          </p>
        </div>

        <DataTable<DeletionLog, ColumnKey, Filters>
          title="Deleted items"
          exportFileName="deleted-items"
          countLabel={(total) => `${total} items`}
          searchPlaceholder="Search deleted items..."
          filters={FILTERS}
          defaultFilters={DEFAULT_FILTERS}
          columns={columns}
          rowKey={(d) => d.deletionid}
          defaultSortBy="deletedat"
          defaultSortOrder="desc"
          fetchData={({ filters, sortBy, ...params }) =>
            getDeletions({
              ...params,
              sortBy: sortBy === 'restore' ? 'deletedat' : sortBy,
              entitytype: filters.entitytype ?? undefined,
              startDate: filters.dateRange.from ?? undefined,
              endDate: filters.dateRange.to ?? undefined,
            })
          }
          selectionActions={({
            selected,
            total,
            clearSelection,
            refresh: reload,
            loadAllRows,
          }) => (
            <>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    void restore(selected, () => {
                      clearSelection();
                      reload();
                    })
                  }
                  disabled={selected.some((d) =>
                    restoringIds.has(d.deletionid),
                  )}
                  className="flex items-center gap-1.5 text-sm border border-indigo-200 bg-white text-indigo-600 rounded-md px-3 py-1.5 hover:bg-indigo-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArchiveRestore size={14} />
                  Restore ({selected.length})
                </button>
              )}
              {total > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    void restoreAll(total, loadAllRows, () => {
                      clearSelection();
                      reload();
                    })
                  }
                  disabled={restoringIds.size > 0}
                  className="flex items-center gap-1.5 text-sm border border-indigo-200 bg-white text-indigo-600 rounded-md px-3 py-1.5 hover:bg-indigo-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArchiveRestore size={14} />
                  Restore all
                </button>
              )}
            </>
          )}
          refreshKey={refreshKey}
          emptyMessage="Nothing has been deleted in the last 30 days."
          loadErrorMessage="Could not load deleted items. Try again."
          bodyOffsetClassName="top-17.25"
        />
      </main>
      {infoModal}
    </div>
  );
}
