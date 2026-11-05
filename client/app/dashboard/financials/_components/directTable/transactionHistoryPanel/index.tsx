'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, titleCase } from '@/utils/format';
import {
  getDirectTransactions,
  getOfficialReceipts,
} from '@/services/financialService';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import type { Transaction, OfficialReceipt } from 'shared';

/**
 * Slide-in panel listing every transaction on a Direct case, newest first.
 */
export default function TransactionHistoryPanel({
  caseid,
  deceasedName,
  totalAmount,
  totalPaid,
  onClose,
}: {
  caseid: number;
  deceasedName: string;
  totalAmount: number | null;
  totalPaid: number;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<OfficialReceipt[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const [txRes, orRes] = await Promise.all([
          getDirectTransactions(caseid, controller.signal),
          getOfficialReceipts(caseid, controller.signal),
        ]);
        setTransactions(txRes.data);
        setReceipts(orRes.data);
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

  const discount = receipts.reduce(
    (sum, r) => sum + Number(r.pwd_discount ?? 0),
    0,
  );

  const totalDue = Math.max((totalAmount ?? 0) - discount, 0);

  const withholding = receipts.reduce(
    (sum, r) => sum + Number(r.withholding_tax ?? 0),
    0,
  );

  const paymentDue = Math.max(totalDue - withholding, 0);

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

        {!isLoading && !errorMsg && (
          <>
            <section className="mb-5 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Total amount</span>
                <span>{formatCurrency(totalAmount ?? 0)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">SC/PWD discount</span>
                  <span>− {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Total due</span>
                <span>{formatCurrency(totalDue)}</span>
              </div>
              {withholding > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Withholding tax</span>
                    <span>− {formatCurrency(withholding)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Payment due</span>
                    <span>{formatCurrency(paymentDue)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Paid</span>
                <span>{formatCurrency(totalPaid)}</span>
              </div>
            </section>

            <section className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Official receipt
              </h3>
              {receipts.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No official receipt generated yet.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {receipts.map((r) => (
                    <li
                      key={r.orid}
                      className="py-2 flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="font-medium text-gray-900">
                          OR #{r.ornumber}
                        </span>
                        <div className="text-xs text-gray-400">
                          {formatDate(r.issuedate)}
                          {` · total due ${formatCurrency(Number(r.total_due))}`}
                          {r.withholding_tax
                            ? ` · withholding ${formatCurrency(Number(r.withholding_tax))}`
                            : ''}
                        </div>
                      </div>
                      <span>{formatCurrency(Number(r.amount))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
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
