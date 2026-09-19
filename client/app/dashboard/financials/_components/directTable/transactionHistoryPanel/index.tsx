'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { formatCurrency, formatDate, titleCase } from '@/utils/format';
import {
  getCaseTransactions,
  type CaseTransaction,
} from '@/services/financialService';

const PANEL_TRANSITION_MS = 300 as const;

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
  const [shown, setShown] = useState(false);
  const [transactions, setTransactions] = useState<CaseTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await getCaseTransactions(caseid, controller.signal);
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

  function handleClose() {
    setShown(false);
    setTimeout(onClose, PANEL_TRANSITION_MS);
  }

  return (
    <>
      <div
        onClick={handleClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Transaction history"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-md bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${
          shown ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <span className="inline-block bg-orange-100 text-orange-800 text-[10px] font-semibold px-2 py-0.5 rounded mb-1.5">
              CASE #{caseid}
            </span>
            <h2 className="text-lg font-serif font-bold text-gray-900 wrap-break-word">
              {deceasedName}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close panel"
            className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </header>

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
      </aside>
    </>
  );
}