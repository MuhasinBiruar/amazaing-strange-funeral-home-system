'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { formatCurrency, formatDate, titleCase } from '@/utils/format';
import {
  getDayTransactions,
  type DayTransaction,
} from '@/services/financialService';

const PANEL_TRANSITION_MS = 300 as const;

export default function DayTransactionsPanel({
  date,
  onClose,
}: {
  date: string;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [items, setItems] = useState<DayTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setErrorMsg(null);

    getDayTransactions(date, date, controller.signal)
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
        aria-label="Transactions for this day"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-md bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${
          shown ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-serif font-bold text-gray-900">
            {formatDate(date)}
          </h2>
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
                    {t.deceased_name && <> &middot; {t.deceased_name}</>}
                    {t.caseid && <> &middot; Case #{t.caseid}</>}
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