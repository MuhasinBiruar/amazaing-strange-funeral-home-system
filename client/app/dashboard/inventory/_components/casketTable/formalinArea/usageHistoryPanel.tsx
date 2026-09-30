'use client';

import type { FormalinUsage } from 'shared';
import DataTable from '@/components/dataTable';
import type { DataTableColumn } from '@/components/dataTable/types';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import { getFormalinUsageHistory } from '@/services/formalinInventoryService';
import { formatDate } from '@/utils/format';

type UsageColumn = keyof Pick<
  FormalinUsage,
  'usagedate' | 'quantityused' | 'casetype' | 'caseid'
>;

export default function FormalinUsageHistoryPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const columns: DataTableColumn<FormalinUsage, UsageColumn>[] = [
    {
      key: 'usagedate',
      label: 'Date',
      render: (row) => formatDate(row.usagedate),
    },
    { key: 'caseid', label: 'Case', render: (row) => `#${row.caseid}` },
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
      ariaLabel="Formalin usage history"
      badge="FORMALIN USAGE"
      badgeClassName="bg-orange-100 text-orange-800"
      title="Usage History"
      subtitle="Recent formalin usage, newest first."
      widthClassName="sm:w-3xl"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <DataTable<FormalinUsage, UsageColumn>
          title="Usage records"
          countLabel={(total) => `${total} records`}
          columns={columns}
          rowKey={(row) => row.usageid}
          defaultSortBy="usagedate"
          defaultSortOrder="desc"
          fetchData={({ page, limit, signal }) =>
            getFormalinUsageHistory({ page, limit, signal })
          }
          emptyMessage="No formalin usage recorded."
          loadErrorMessage="Could not load usage history. Try again."
          bodyOffsetClassName="top-12"
        />
      </div>
    </SidePanel>
  );
}
