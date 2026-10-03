'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, titleCase } from '@/utils/format';
import { getFinancialDetails } from '@/services/financialService';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import type { FinancialDetail } from 'shared';

export default function DayDetailsPanel({
  date,
  onClose,
}: {
  date: string;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [items, setItems] = useState<FinancialDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setErrorMsg(null);

    getFinancialDetails(date, date, controller.signal)
      .then((res) => setItems(res.data))
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load day transactions:', error);
        setErrorMsg('Could not load transactions for this day.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [date]);

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Transactions for this day"
      title={formatDate(date)}
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {!isLoading && errorMsg && (
          <p className="text-sm text-red-500">{errorMsg}</p>
        )}

        {!isLoading && !errorMsg && items.length === 0 && (
          <p className="text-sm text-gray-400">No activity on this day.</p>
        )}

        {!isLoading && !errorMsg && items.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {items.map((t) => (
              <li key={`${t.source}-${t.id}`} className="py-3 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      t.direction === 'in' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {t.direction === 'in' ? '+' : '-'}
                    {formatCurrency(Number(t.amount))}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(t.datetime).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {titleCase(t.category)}
                  {t.description && <> &middot; {t.description}</>}
                  {t.deceased_name && <> &middot; {t.deceased_name}</>}
                  {t.caseid && <> &middot; Case #{t.caseid}</>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SidePanel>
  );
}
