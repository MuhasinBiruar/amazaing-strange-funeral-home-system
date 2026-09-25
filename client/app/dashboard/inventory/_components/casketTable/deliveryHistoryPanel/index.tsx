'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getCasketInventoryById } from '@/services/casketInventoryService';
import { formatCurrency, titleCase } from '@/utils/format';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import type { DeliveryHistoryType } from './types';

export default function DeliveryHistoryPanel({
  casketid,
  caskettype,
  onClose,
}: {
  casketid: number;
  caskettype: string;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistoryType[]>(
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadPackages() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const history = await getCasketInventoryById(
          casketid,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        setDeliveryHistory(history);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Failed to load casket deliveries:', error);
        setLoadError('Could not load deliveries. Try again.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadPackages();
    return () => controller.abort();
  }, [casketid]);

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={`Delivery history for ${caskettype}`}
      badge="CASKET PACKAGES"
      badgeClassName="bg-blue-100 text-blue-800"
      title={caskettype}
      subtitle="Deliveries that include this casket"
    >
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading delivery history...
          </div>
        )}

        {!isLoading && loadError && (
          <p className="text-sm text-red-500">{loadError}</p>
        )}

        {!isLoading && !loadError && deliveryHistory.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">
            No delivery history for this casket.
          </p>
        )}

        {!isLoading && !loadError && deliveryHistory.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {deliveryHistory.length}{' '}
              {deliveryHistory.length === 1 ? 'package' : 'packages'}
            </p>
            {deliveryHistory.map((dlv) => (
              <article
                key={dlv.deliveryid}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {dlv.deliverydate instanceof Date
                        ? dlv.deliverydate.toLocaleDateString()
                        : new Date(
                            dlv.deliverydate as string,
                          ).toLocaleDateString()}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-blue-700">
                      Quantity: {titleCase(dlv.quantityreceived.toString())}{' '}
                      received
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-gray-900">
                    Total paid: {formatCurrency(dlv.totalamountpaid)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </SidePanel>
  );
}
