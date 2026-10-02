'use client';

import { useState } from 'react';
import axios from 'axios';
import { API } from '@/services/api';
import { extractErrorMessage } from '@/services/utils/extractErrorMessage';
import { useInfoModal } from '@/components/infoModal/useInfoModal';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import LoadingButton from '@/components/loadingButton';
import { fieldClass, labelClass } from '@/components/formStyles';

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

export default function RecordTransactionPanel({
  caseId,
  deceasedName,
  onClose,
  onSuccess,
}: {
  caseId: number;
  deceasedName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const { infoModal, showInfo } = useInfoModal();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Payment');
  const [orNumber, setOrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await showInfo({
        title: 'Invalid Payment',
        message: 'Please enter a valid amount.',
        severity: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createTransaction({
        caseid: caseId,
        amount: parsedAmount,
        paymentcategory: category,
        ornumber: orNumber.trim() || undefined,
      });
    } catch (err) {
      setIsSubmitting(false);
      console.error('Error recording transaction:', err);

      await showInfo({
        title: 'Could Not Save Payment',
        message:
          axios.isAxiosError(err) && err.response?.data?.error?.message
            ? extractErrorMessage(err.response.data)
            : 'Failed to record transaction.',
        severity: 'error',
      });
      return;
    }

    // Parents only refresh their table in onSuccess, so close with the
    // slide-out transition ourselves.
    onSuccess();
    requestClose();
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Record payment"
      badge={`CASE #${caseId}`}
      badgeClassName="bg-orange-100 text-orange-800"
      title="Record Payment"
      subtitle={deceasedName}
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label htmlFor="payment-amount" className={labelClass}>
              Amount (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ₱
              </span>
              <input
                id="payment-amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${fieldClass} pl-7`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="payment-category" className={labelClass}>
              Category
            </label>
            <select
              id="payment-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${fieldClass} cursor-pointer`}
            >
              <option value="Payment">Payment</option>
              <option value="Downpayment">Downpayment</option>
              <option value="Full Payment">Full Payment</option>
              <option value="Refund">Refund</option>
            </select>
          </div>

          <div>
            <label htmlFor="payment-or" className={labelClass}>
              Official Receipt No.{' '}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="payment-or"
              type="text"
              value={orNumber}
              onChange={(e) => setOrNumber(e.target.value)}
              placeholder="e.g., OR-123456"
              className={fieldClass}
            />
          </div>
        </div>

        <footer className="px-5 py-4 border-t border-gray-200 shrink-0">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={requestClose}
              className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              label="Save payment"
              loadingLabel="Saving..."
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
          </div>
        </footer>
      </form>

      {infoModal}
    </SidePanel>
  );
}
