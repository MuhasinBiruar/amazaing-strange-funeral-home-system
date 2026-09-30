'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ClipboardList, History, Plus } from 'lucide-react';
import type { FormalinInventory } from 'shared';
import { useInfoModal } from '@/components/infoModal/useInfoModal';
import { getFormalinInventory } from '@/services/formalinInventoryService';
import { formatDate } from '@/utils/format';
import FormalinDeliveryHistoryPanel from './deliveryHistoryPanel';
import FormalinRecordPanel from './recordPanel';
import FormalinUsageHistoryPanel from './usageHistoryPanel';

export default function FormalinArea() {
  const [inventory, setInventory] = useState<FormalinInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<'record' | 'deliveries' | 'usage' | null>(
    null,
  );
  const { infoModal, showInfo } = useInfoModal();

  async function loadInventory() {
    setIsLoading(true);
    setError(null);
    try {
      setInventory(await getFormalinInventory());
    } catch (requestError) {
      console.error('Failed to load formalin inventory:', requestError);
      setError('Could not load formalin inventory. Try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadInventory);
  }, []);

  async function handleSaved(warning: string | null) {
    setPanel(null);
    await loadInventory();
    if (warning) {
      await showInfo({
        title: 'Formalin stock warning',
        message: warning,
        severity: 'warning',
        closeLabel: 'Close',
      });
    }
  }

  const atThreshold =
    inventory !== null && inventory.currentstock <= inventory.minimumthreshold;

  return (
    <>
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Formalin Inventory
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Current formalin stock and usage records.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPanel('record')}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={16} /> Record Usage
            </button>
            <button
              type="button"
              onClick={() => setPanel('deliveries')}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ClipboardList size={16} /> Delivery History
            </button>
            <button
              type="button"
              onClick={() => setPanel('usage')}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <History size={16} /> View Usage History
            </button>
          </div>
        </div>

        {isLoading && (
          <p className="text-sm text-gray-500">Loading formalin inventory...</p>
        )}
        {!isLoading && error && <p className="text-sm text-red-600">{error}</p>}
        {!isLoading && !error && inventory && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Current amount
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {inventory.currentstock} L
              </p>
            </div>
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Minimum threshold
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {inventory.minimumthreshold} L
              </p>
            </div>
            <div
              className={`rounded-md p-4 ${atThreshold ? 'bg-amber-50' : 'bg-gray-50'}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Last updated
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatDate(inventory.date)}
              </p>
              {atThreshold && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                  <AlertTriangle size={14} /> At or below threshold
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {panel === 'record' && inventory && (
        <FormalinRecordPanel
          inventory={inventory}
          onClose={() => setPanel(null)}
          onSaved={handleSaved}
        />
      )}
      {panel === 'deliveries' && (
        <FormalinDeliveryHistoryPanel onClose={() => setPanel(null)} />
      )}
      {panel === 'usage' && (
        <FormalinUsageHistoryPanel onClose={() => setPanel(null)} />
      )}
      {infoModal}
    </>
  );
}
