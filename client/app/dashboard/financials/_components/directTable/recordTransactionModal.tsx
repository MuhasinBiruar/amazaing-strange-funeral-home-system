'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { API } from '@/services/api';

export async function createTransaction(data: {
  caseid: number;
  amount: number;
  paymentcategory: string;
  ornumber?: string;
}) {
  const result = await API.post(`/financial/transactions`, data, {
    withCredentials: true,
  });
  return result.data || result;
}

interface Props {
  caseId: number;
  deceasedName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecordTransactionModal({
  caseId,
  deceasedName,
  onClose,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Payment');
  const [orNumber, setOrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      setIsSubmitting(false);
      return;
    }

    try {
      await createTransaction({
        caseid: caseId,
        amount: parsedAmount,
        paymentcategory: category,
        ornumber: orNumber.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      if (typeof err === 'object' && err !== null) {
        const errorObj = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        setError(
          errorObj.response?.data?.message ||
            errorObj.message ||
            'Failed to record transaction.',
        );
      } else {
        setError('Failed to record transaction.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Record Payment
            </h2>
            <p className="text-xs text-gray-500">For: {deceasedName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                ₱
              </span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border border-gray-300 pl-8 pr-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Payment">Payment</option>
              <option value="Downpayment">Downpayment</option>
              <option value="Full Payment">Full Payment</option>
              <option value="Refund">Refund</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Official Receipt No.{' '}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={orNumber}
              onChange={(e) => setOrNumber(e.target.value)}
              placeholder="e.g., OR-123456"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
