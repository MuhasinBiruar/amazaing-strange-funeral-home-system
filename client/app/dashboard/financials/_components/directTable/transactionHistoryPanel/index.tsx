'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, titleCase } from '@/utils/format';
import {
  createOfficialReceiptFromHistory,
  getDirectTransactions,
  getOfficialReceipts,
} from '@/services/financialService';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import type { Transaction, OfficialReceipt } from 'shared';
import {
  downloadOfficialReceiptPdf,
  type ReceiptPaymentBreakdown,
} from '../officialReceiptPdf';

/**
 * Slide-in panel listing every transaction on a Direct case, newest first.
 */
export default function TransactionHistoryPanel({
  caseid,
  deceasedName,
  representativeName,
  totalAmount,
  totalPaid,
  onClose,
}: {
  caseid: number;
  deceasedName: string;
  representativeName?: string | null;
  totalAmount: number | null;
  totalPaid: number;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<OfficialReceipt[]>([]);
  const [isReceiptFormOpen, setIsReceiptFormOpen] = useState(false);
  const [receiptTransaction, setReceiptTransaction] =
    useState<Transaction | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [payerName, setPayerName] = useState('');
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

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

  // The contract total is reduced when the official receipt stores its
  // discount and withholding, so do not deduct them again in the history.
  const totalDue = Math.max(totalAmount ?? 0, 0);
  const originalAmount = totalDue + discount;

  const withholding = receipts.reduce(
    (sum, r) => sum + Number(r.withholding_tax ?? 0),
    0,
  );

  const paymentDue = totalDue;

  async function generateReceipt() {
    if (!receiptNumber.trim()) return;

    setIsGeneratingReceipt(true);
    setErrorMsg(null);
    try {
      const receipt = await createOfficialReceiptFromHistory(caseid, {
        transactionid: receiptTransaction?.transactionid,
        ornumber: receiptNumber.trim(),
        payer_name: payerName.trim(),
      });
      setReceipts([receipt]);
      setIsReceiptFormOpen(false);
      setReceiptNumber('');
      setPayerName('');
      setReceiptTransaction(null);
    } catch (error) {
      console.error('Failed to generate official receipt:', error);
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Could not generate official receipt. Try again.',
      );
    } finally {
      setIsGeneratingReceipt(false);
    }

  }

  async function downloadReceipt(receipt: OfficialReceipt) {
    try {
      const receiptTransaction = transactions.find(
        (transaction) => transaction.transactionid === receipt.transactionid,
      );
      const paymentsThroughReceipt = transactions
        .filter(
          (transaction) =>
            transaction.transactionstatus === 'completed' &&
            (!receiptTransaction ||
              new Date(transaction.paymentdatetime).getTime() <
                new Date(receiptTransaction.paymentdatetime).getTime() ||
              (new Date(transaction.paymentdatetime).getTime() ===
                new Date(receiptTransaction.paymentdatetime).getTime() &&
                transaction.transactionid <= receiptTransaction.transactionid)),
        )
        .sort(
          (left, right) =>
            new Date(left.paymentdatetime).getTime() -
              new Date(right.paymentdatetime).getTime() ||
            left.transactionid - right.transactionid,
        );
      const paidThroughReceipt = paymentsThroughReceipt.reduce(
        (sum, transaction) =>
          sum +
          (transaction.paymentcategory === 'Refund'
            ? -Number(transaction.amount)
            : Number(transaction.amount)),
        0,
      );
      const paidAmount = receiptTransaction ? paidThroughReceipt : totalPaid;

      await downloadOfficialReceiptPdf(
        receipt,
        deceasedName,
        representativeName,
        Math.max(paidAmount, 0),
        Math.max(paymentDue - paidAmount, 0),
        paymentsThroughReceipt.map(
          (transaction): ReceiptPaymentBreakdown => ({
            date: new Date(transaction.paymentdatetime),
            amount: Number(transaction.amount),
            isRefund: transaction.paymentcategory === 'Refund',
          }),
        ),
      );
    } catch (error) {
      console.error('Failed to create official receipt PDF:', error);
      setErrorMsg('Could not create the receipt PDF. Try again.');
    }
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Transaction history"
      badge="PAYMENT HISTORY"
      badgeClassName="bg-orange-100 text-orange-800"
      title={deceasedName}
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 print:hidden">
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
                <span className="text-gray-500">Total amount (original)</span>
                <span>{formatCurrency(originalAmount)}</span>
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
                <>
                  <p className="text-sm text-gray-400">
                    No official receipt generated yet.
                  </p>
                  {transactions.some(
                    (transaction) =>
                      transaction.transactionstatus === 'completed' &&
                      transaction.paymentcategory !== 'Refund',
                  ) && (
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptTransaction(null);
                        setIsReceiptFormOpen(true);
                      }}
                      className="mt-2 rounded border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Generate OR for all payments
                    </button>
                  )}
                </>
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
                      <div className="flex items-center gap-2">
                        <span>{formatCurrency(Number(r.amount))}</span>
                        <button
                          type="button"
                          onClick={() => void downloadReceipt(r)}
                          className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Download PDF
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {isReceiptFormOpen && (
              <div className="mb-5 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Generate official receipt
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  {receiptTransaction
                    ? `This receipt will use the ${formatCurrency(Number(receiptTransaction.amount))} payment from ${formatDate(receiptTransaction.paymentdatetime)}.`
                    : 'This receipt will use the completed payment history for this case.'}
                </p>
                <label
                  htmlFor="history-or-number"
                  className="mt-3 block text-xs font-medium text-gray-700"
                >
                  OR number
                </label>
                <input
                  id="history-or-number"
                  value={receiptNumber}
                  onChange={(event) => setReceiptNumber(event.target.value)}
                  placeholder="e.g. 0346"
                  className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={isGeneratingReceipt}
                />
                <label
                  htmlFor="history-payer-name"
                  className="mt-3 block text-xs font-medium text-gray-700"
                >
                  Payer name (optional)
                </label>
                <input
                  id="history-payer-name"
                  value={payerName}
                  onChange={(event) => setPayerName(event.target.value)}
                  placeholder="Leave blank to use the listed representative"
                  className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={isGeneratingReceipt}
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReceiptFormOpen(false)}
                    disabled={isGeneratingReceipt}
                    className="rounded border border-gray-200 px-3 py-1.5 text-xs text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void generateReceipt()}
                    disabled={isGeneratingReceipt || !receiptNumber.trim()}
                    className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {isGeneratingReceipt ? 'Generating...' : 'Generate OR'}
                  </button>
                </div>
              </div>
            )}
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
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(Number(t.amount))}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {formatDate(t.paymentdatetime)}
                    </span>
                  </div>
                  {t.transactionstatus === 'completed' &&
                    t.paymentcategory !== 'Refund' &&
                    !receipts.some(
                      (receipt) => receipt.transactionid === t.transactionid,
                    ) && (
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptTransaction(t);
                          setReceiptNumber('');
                          setPayerName('');
                          setIsReceiptFormOpen(true);
                        }}
                        className="rounded border border-indigo-200 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        Generate OR
                      </button>
                    )}
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
