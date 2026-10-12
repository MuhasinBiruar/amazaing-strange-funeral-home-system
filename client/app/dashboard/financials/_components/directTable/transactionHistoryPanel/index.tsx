'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, titleCase } from '@/utils/format';
import { getDirectTransactions } from '@/services/financialService';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import type { Transaction } from 'shared';

/**
 * Slide-in panel listing every transaction on a Direct case, newest first.
 */
export default function TransactionHistoryPanel({
  caseid,
  deceasedName,
  onClose,
}: {
  caseid: number;
  deceasedName: string;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await getDirectTransactions(caseid, controller.signal);
        setTransactions(res.data);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to load transaction history:', error);
        setErrorMsg('Could not load transaction history. Try again.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    load();

    return () => controller.abort();
  }, [caseid]);

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Transaction history"
      badge={`CASE #${caseid}`}
      badgeClassName="bg-orange-100 text-orange-800"
      title={deceasedName}
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

        {!isLoading && !errorMsg && transactions.length === 0 && (
          <p className="text-sm text-gray-400">
            No transactions recorded for this case yet.
          </p>
        )}

        {!isLoading && !errorMsg && transactions.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <li key={t.transactionid} className="py-3 flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(Number(t.amount))}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(t.paymentdatetime)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{titleCase(t.paymentcategory)}</span>
                  <span>&middot;</span>
                  <span>{titleCase(t.transactionstatus)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SidePanel>
  );
}
