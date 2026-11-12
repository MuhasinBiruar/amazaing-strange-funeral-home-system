'use client';

import { useEffect, useState } from 'react';
import type { InventoryAudit } from 'shared';
import { createInventoryAuditQuerySchema, updateInventoryAuditQuerySchema } from 'shared';
import SidePanel from '@/components/sidePanel';
import LoadingButton from '@/components/loadingButton';
import DataTable from '@/components/dataTable';
import type { DataTableColumn } from '@/components/dataTable/types';
import { fieldClass, labelClass } from '@/components/formStyles';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import { getCasketInventory } from '@/services/casketInventoryService';
import { getFormalinInventory } from '@/services/formalinInventoryService';
import {
  createInventoryAudit,
  getAuditDeliveries,
  updateInventoryAudit,
  type AuditDelivery,
} from '@/services/inventoryAuditService';
import { toDateInputValue } from '@/utils/toDateInputValue';

type AuditTarget = {
  id: number;
  targetType: 'Formalin' | 'Casket';
  targetname: string;
  currentstock: number;
  minimumthreshold: number;
  formalinid: number | null;
  casketid: number | null;
};

type TargetColumn = 'targetname' | 'targetType' | 'currentstock' | 'minimumthreshold';
type DeliveryColumn = 'deliverydate' | 'quantityreceived' | 'totalamountpaid';

export default function AuditPanel({
  audit,
  onClose,
  onSaved,
  targetType = 'formalin',
}: {
  audit: InventoryAudit | null;
  onClose: () => void;
  onSaved: () => void;
  targetType?: 'formalin' | 'casket';
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [targets, setTargets] = useState<AuditTarget[]>([]);
  const [targetsRefreshKey, setTargetsRefreshKey] = useState(0);
  const [auditdate, setAuditDate] = useState(toDateInputValue(audit?.auditdate ?? new Date()));
  const [selectedTarget, setSelectedTarget] = useState<AuditTarget | null>(null);
  const [hasDiscrepancy, setHasDiscrepancy] = useState(audit?.hasdiscrepancy ?? false);
  const [currentStock, setCurrentStock] = useState('');
  const [deliveries, setDeliveries] = useState<AuditDelivery[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [correctedQuantity, setCorrectedQuantity] = useState('');
  const [correctedTotalAmountPaid, setCorrectedTotalAmountPaid] = useState('');
  const [deliveryTableRefreshKey, setDeliveryTableRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (audit) {
      const inventoryRequest =
        targetType === 'casket'
          ? getCasketInventory().then((items) =>
              items.find((item) => item.casketid === audit.casketid)?.currentstock,
            )
          : getFormalinInventory().then((item) => item.currentstock);
      Promise.all([
        inventoryRequest,
        getAuditDeliveries(
          targetType,
          targetType === 'casket' ? audit.casketid! : audit.formalinid!,
        ),
      ])
        .then(([stock, history]) => {
          setCurrentStock(stock === undefined ? '' : String(stock));
          setDeliveries(history);
          setDeliveryTableRefreshKey((key) => key + 1);
        })
        .catch((reason) => {
          console.error('Failed to load inventory audit correction data:', reason);
          setError('Could not load correction details. Try again.');
        });
      return;
    }
    Promise.all([
      targetType === 'casket' ? getCasketInventory() : Promise.resolve([]),
      targetType === 'formalin' ? getFormalinInventory() : Promise.resolve(null),
    ])
      .then(([casketRows, formalinRow]) => {
        const loadedTargets: AuditTarget[] = [
          ...(formalinRow
            ? [{
            id: formalinRow.formalinid,
            targetType: 'Formalin' as const,
            targetname: 'Formalin stock',
            currentstock: formalinRow.currentstock,
            minimumthreshold: formalinRow.minimumthreshold,
            formalinid: formalinRow.formalinid,
            casketid: null,
          }]
            : []),
          ...casketRows.map((item) => ({
            id: item.casketid,
            targetType: 'Casket' as const,
            targetname: item.caskettype,
            currentstock: item.currentstock,
            minimumthreshold: item.minimumthreshold,
            formalinid: null,
            casketid: item.casketid,
          })),
        ];
        setTargets(loadedTargets);
        if (targetType === 'formalin') setSelectedTarget(loadedTargets[0] ?? null);
        setTargetsRefreshKey((key) => key + 1);
      })
      .catch((reason) => {
        console.error('Failed to load inventory audit targets:', reason);
        setError('Could not load inventory items. Try again.');
      });
  }, [audit, targetType]);

  async function save() {
    setError(null);
    if (audit) {
      const parsed = updateInventoryAuditQuerySchema.safeParse({
        auditdate: new Date(auditdate),
        hasdiscrepancy: hasDiscrepancy,
        ...(audit.hasdiscrepancy && !hasDiscrepancy
          ? {
              currentstock: Number(currentStock),
              deliveryid: Number(selectedDeliveryId),
              correctedquantityreceived: Number(correctedQuantity),
              correctedtotalamountpaid: Number(correctedTotalAmountPaid),
            }
          : {}),
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Check the audit fields.');
        return;
      }
      setSaving(true);
      try {
        await updateInventoryAudit(audit.auditid, parsed.data);
        onSaved();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Could not save audit.');
        setSaving(false);
      }
      return;
    }

    const parsed = createInventoryAuditQuerySchema.safeParse({
      auditdate: new Date(auditdate),
      hasdiscrepancy: hasDiscrepancy,
      formalinid:
        targetType === 'formalin' ? selectedTarget?.formalinid ?? null : null,
      casketid:
        targetType === 'casket' ? selectedTarget?.casketid ?? null : null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Select an inventory item.');
      return;
    }
    setSaving(true);
    try {
      await createInventoryAudit(parsed.data);
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save audit.');
      setSaving(false);
    }
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={audit ? 'Edit inventory audit' : 'Record inventory audit'}
      badge={audit ? 'EDIT INVENTORY AUDIT' : 'NEW INVENTORY AUDIT'}
      title={audit ? audit.targetname : 'Record Inventory Audit'}
      widthClassName="sm:w-5xl"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          <label htmlFor="audit-date" className={labelClass}>Audit date</label>
          <input id="audit-date" type="date" value={auditdate} onChange={(event) => setAuditDate(event.target.value)} className={fieldClass} />
        </div>
        {!audit && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Select inventory item
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {selectedTarget
                  ? `Selected: ${selectedTarget.targetname}`
                  : 'Choose the formalin or casket being audited.'}
              </p>
            </div>
            {targetType === 'formalin' ? (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-indigo-900">Formalin stock</p>
                <p className="mt-1 text-sm text-indigo-700">
                  Current recorded stock:{' '}
                  <span className="font-semibold">
                    {selectedTarget?.currentstock ?? 'Loading...'} liters
                  </span>
                </p>
              </div>
            ) : (
              <DataTable<AuditTarget, TargetColumn>
                title="Inventory items"
                countLabel={(total) => `${total} items`}
                searchPlaceholder="Search inventory..."
                columns={[
                  { key: 'targetname', label: 'Item', render: (item) => item.targetname },
                  { key: 'targetType', label: 'Type', render: (item) => item.targetType },
                  { key: 'currentstock', label: 'Current stock', render: (item) => item.currentstock },
                  { key: 'minimumthreshold', label: 'Minimum', render: (item) => item.minimumthreshold },
                ] satisfies DataTableColumn<AuditTarget, TargetColumn>[]}
                rowKey={(item) => `${item.targetType}-${item.id}`}
                defaultSortBy="targetname"
                defaultSortOrder="asc"
                onRowClick={setSelectedTarget}
                refreshKey={targetsRefreshKey}
                isRowSelected={(item) =>
                  item.id === selectedTarget?.id &&
                  item.targetType === selectedTarget.targetType
                }
                fetchData={async ({ page, limit, search, sortBy, sortOrder }) => {
                  const filtered = search
                    ? targets.filter((item) =>
                        `${item.targetname} ${item.targetType}`.toLowerCase().includes(search.toLowerCase()),
                      )
                    : targets;
                  const sorted = [...filtered].sort((a, b) => {
                    const comparison = String(a[sortBy]).localeCompare(String(b[sortBy]), undefined, { numeric: true });
                    return sortOrder === 'asc' ? comparison : -comparison;
                  });
                  return {
                    data: sorted.slice((page - 1) * limit, page * limit),
                    meta: { total: sorted.length, page, limit, totalPages: Math.ceil(sorted.length / limit) },
                  };
                }}
                emptyMessage="No inventory items found."
                loadErrorMessage="Could not load inventory items. Try again."
              />
            )}
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={hasDiscrepancy} onChange={(event) => setHasDiscrepancy(event.target.checked)} className="size-4 accent-indigo-600" />
          Discrepancy found
        </label>
        {audit?.hasdiscrepancy && hasDiscrepancy && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            To resolve this discrepancy, uncheck <strong>Discrepancy found</strong>.
            The correction fields will then appear.
          </p>
        )}
        {audit?.hasdiscrepancy && !hasDiscrepancy && (
          <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <div>
              <h3 className="text-sm font-semibold text-emerald-900">
                Resolve this discrepancy
              </h3>
              <ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-emerald-700">
                <li>Count the actual stock and enter it below.</li>
                <li>Select the delivery record that needs correction.</li>
                <li>Correct its quantity received and total paid.</li>
                <li>Uncheck <strong>Discrepancy found</strong>, then save to resolve it.</li>
              </ol>
            </div>
            <div>
              <p className={labelClass}>
                Current stock
              </p>
              <p className="mb-2 text-sm text-gray-600">
                System-recorded: <span className="font-semibold text-gray-900">{currentStock || 'Loading...'}</span>
              </p>
              <label htmlFor="audit-current-stock" className={labelClass}>
                Actual current stock
              </label>
              <input
                id="audit-current-stock"
                type="number"
                min="0"
                step={targetType === 'formalin' ? '0.01' : '1'}
                value={currentStock}
                onChange={(event) => setCurrentStock(event.target.value)}
                className={fieldClass}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the quantity physically counted during this audit.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-emerald-900">
                Delivery history to correct
              </h3>
              <p className="text-xs text-emerald-700">
                Select the delivery record whose received quantity or total paid should be corrected.
              </p>
              <DataTable<AuditDelivery, DeliveryColumn>
                title="Delivery history"
                countLabel={(total) => `${total} deliveries`}
                searchPlaceholder="Search delivery history..."
                columns={[
                  {
                    key: 'deliverydate',
                    label: 'Delivery date',
                    render: (delivery) =>
                      new Date(delivery.deliverydate).toLocaleDateString(),
                  },
                  {
                    key: 'quantityreceived',
                    label: 'Quantity received',
                    render: (delivery) => delivery.quantityreceived,
                  },
                  {
                    key: 'totalamountpaid',
                    label: 'Total paid',
                    render: (delivery) => delivery.totalamountpaid,
                  },
                ] satisfies DataTableColumn<AuditDelivery, DeliveryColumn>[]}
                rowKey={(delivery) => delivery.deliveryid}
                defaultSortBy="deliverydate"
                defaultSortOrder="desc"
                onRowClick={(delivery) => {
                  setSelectedDeliveryId(String(delivery.deliveryid));
                  setCorrectedQuantity(String(delivery.quantityreceived));
                  setCorrectedTotalAmountPaid(String(delivery.totalamountpaid));
                }}
                isRowSelected={(delivery) =>
                  delivery.deliveryid === Number(selectedDeliveryId)
                }
                refreshKey={deliveryTableRefreshKey}
                fetchData={async ({ page, limit, search, sortBy, sortOrder }) => {
                  const filtered = search
                    ? deliveries.filter((delivery) =>
                        `${delivery.deliverydate} ${delivery.quantityreceived} ${delivery.totalamountpaid}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                    : deliveries;
                  const sorted = [...filtered].sort((a, b) => {
                    const left = String(a[sortBy]);
                    const right = String(b[sortBy]);
                    const comparison = left.localeCompare(right, undefined, {
                      numeric: true,
                    });
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
                emptyMessage="No delivery history found."
                loadErrorMessage="Could not load delivery history. Try again."
              />
            </div>
            <div>
              <label htmlFor="audit-corrected-quantity" className={labelClass}>
                Corrected quantity received
              </label>
              <input
                id="audit-corrected-quantity"
                type="number"
                min="0"
                step={targetType === 'formalin' ? '0.01' : '1'}
                value={correctedQuantity}
                onChange={(event) => setCorrectedQuantity(event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="audit-corrected-total-paid" className={labelClass}>
                Corrected total paid
              </label>
              <input
                id="audit-corrected-total-paid"
                type="number"
                min="0"
                step="0.01"
                value={correctedTotalAmountPaid}
                onChange={(event) => setCorrectedTotalAmountPaid(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={requestClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
          <LoadingButton type="button" isLoading={saving} onClick={() => void save()} label={audit ? 'Save changes' : 'Record audit'} loadingLabel="Saving..." className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer" />
        </div>
      </div>
    </SidePanel>
  );
}
