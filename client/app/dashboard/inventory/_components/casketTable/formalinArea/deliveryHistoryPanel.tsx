'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { FormalinDeliveryHistory } from 'shared';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import { getFormalinDeliveries } from '@/services/formalinInventoryService';
import { formatDate } from '@/utils/format';

export default function FormalinDeliveryHistoryPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [rows, setRows] = useState<FormalinDeliveryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getFormalinDeliveries(controller.signal)
      .then(setRows)
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          console.error('Failed to load formalin deliveries:', requestError);
          setError('Could not load delivery history. Try again.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Formalin delivery history"
      badge="FORMALIN DELIVERIES"
      badgeClassName="bg-orange-100 text-orange-800"
      title="Delivery History"
      subtitle="Recent formalin deliveries, newest first."
    >
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" /> Loading delivery
            history...
          </div>
        )}
        {!isLoading && error && <p className="text-sm text-red-600">{error}</p>}
        {!isLoading && !error && rows.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">
            No deliveries recorded.
          </p>
        )}
        {!isLoading &&
          !error &&
          rows.map((row) => (
            <article
              key={row.deliveryid}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {formatDate(row.deliverydate)}
                  </h3>
                  <p className="mt-1 text-sm text-orange-700">
                    {row.quantityreceived} liters received
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  Inventory #{row.formalinid ?? '—'}
                </span>
              </div>
            </article>
          ))}
      </div>
    </SidePanel>
  );
}
