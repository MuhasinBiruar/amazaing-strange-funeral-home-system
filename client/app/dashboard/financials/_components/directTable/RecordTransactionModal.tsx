'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { createCaseTransaction } from '@/services/financialService';
import type { PaymentCategory, PaymentMethod } from 'shared';

const PAYMENT_CATEGORIES: PaymentCategory[] = [
  'Down Payment',
  'Installment',
  'Full Payment',
  'Refund',
];


const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'GCash',
  'Check',
  'Credit Card',
];

interface Props {
  caseId: number;
  deceasedName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecordTransactionModal({
  caseId,
  deceasedName,
  onClose,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<PaymentCategory>('Down Payment');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [orNumber, setOrNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await createCaseTransaction(caseId, {
        amount: parsedAmount,
        paymentcategory: category,
        paymentmethod: method,
        orNumber: orNumber.trim()
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Transaction creation error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to record transaction.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Record Payment</h3>
            <p className="text-xs text-gray-500">
              Case #{caseId} {deceasedName ? `· ${deceasedName}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-600">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Amount (₱)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              OR Number (Optional)
            </label>
            <input
              type="text"
              value={orNumber}
              onChange={(e) => setOrNumber(e.target.value)}
              placeholder="e.g. OR-12345"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PaymentCategory)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {PAYMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
