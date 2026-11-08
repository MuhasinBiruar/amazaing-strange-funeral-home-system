'use client';

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import type { InventoryAudit } from 'shared';
import DataTable from '@/components/dataTable';
import type { DataTableColumn } from '@/components/dataTable/types';
import { formatDate } from '@/utils/format';
import { getInventoryAudits } from '@/services/inventoryAuditService';
import AuditPanel from './auditPanel';
import PillBadge from '@/components/pillBadge';

type ColumnKey =
  | 'auditdate'
  | 'targetname'
  | 'currentstock'
  | 'hasdiscrepancy'
  | 'manage';
type AuditType = 'formalin' | 'casket';

export default function AuditTab() {
  const [auditType, setAuditType] = useState<AuditType>('formalin');
  const [editing, setEditing] = useState<InventoryAudit | null | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const columns: DataTableColumn<InventoryAudit, ColumnKey>[] = [
    {
      key: 'auditdate',
      label: auditType === 'formalin' ? 'Stock date' : 'Audit date',
      render: (row) => formatDate(row.auditdate),
    },
    ...(auditType === 'formalin'
      ? [{
          key: 'currentstock' as const,
          label: 'Recorded stock',
          render: (row: InventoryAudit) => `${row.currentstock ?? 0} L`,
        }]
      : [{
          key: 'targetname' as const,
          label: 'Inventory item',
          render: (row: InventoryAudit) => row.targetname,
        }]),
    {
      key: 'hasdiscrepancy',
      label: 'Status',
      render: (row) => (
        <PillBadge variant={row.hasdiscrepancy ? 'warning' : 'success'}>
          {row.hasdiscrepancy ? 'Discrepancy reported' : 'Resolved'}
        </PillBadge>
      ),
      exportValue: (row) => (row.hasdiscrepancy ? 'Discrepancy reported' : 'Resolved'),
    },
    {
      key: 'manage',
      label: 'Edit',
      sortable: false,
      exportable: false,
      render: (row) => (
        <button
          type="button"
          onClick={() => setEditing(row)}
          className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
          aria-label={`Edit audit for ${row.targetname}`}
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
          <Plus size={16} /> Record {auditType} audit
        </button>
      </div>
      <div className="flex border-b border-gray-200">
        {(['formalin', 'casket'] as const).map((type) => (
          <button
            key={type}
            type="button"
              onClick={() => {
                setEditing(undefined);
                setAuditType(type);
              }}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize cursor-pointer ${
              auditType === type
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {type} audits
          </button>
        ))}
      </div>
      <DataTable<InventoryAudit, ColumnKey>
        key={auditType}
        title={`${auditType === 'formalin' ? 'Formalin stock history' : 'Casket audits'}`}
        exportFileName={`${auditType}-audits`}
        countLabel={(total) => `${total} audits`}
        searchPlaceholder="Search inventory audits..."
        columns={columns}
        rowKey={(row) => row.auditid}
        deletable={(row) => ({
          entitytype: 'inventoryaudit',
          id: row.auditid,
        })}
        defaultSortBy="auditdate"
        defaultSortOrder="desc"
        fetchData={({ sortBy, ...params }) =>
          getInventoryAudits({
            ...params,
            targetType: auditType,
            sortBy: sortBy === 'manage' ? 'auditdate' : sortBy,
          })
        }
        refreshKey={refreshKey}
        emptyMessage="No inventory audits found."
        loadErrorMessage="Could not load inventory audits. Try again."
      />
      {editing !== undefined && (
        <AuditPanel
          audit={editing}
          targetType={auditType}
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
