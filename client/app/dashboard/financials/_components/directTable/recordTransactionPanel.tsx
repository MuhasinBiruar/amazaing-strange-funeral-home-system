'use client';

import { useState } from 'react';
import { createDirectTransaction } from '@/services/financialService';
import { useInfoModal } from '@/components/infoModal/useInfoModal';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import LoadingButton from '@/components/loadingButton';
import { fieldClass, labelClass } from '@/components/formStyles';
import {
  createTransactionQuerySchema,
  paymentCategoryEnum,
  paymentMethodEnum,
} from 'shared';

/** `<input type="date">` wants `yyyy-mm-dd` in the viewer's local time. */
function toDateInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
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
  const [paymentdatetime, setPaymentdatetime] = useState<string>(
    toDateInputValue(new Date()),
  );
  const [paymentmethod, setPaymentmethod] = useState<string>(
    paymentMethodEnum.options[0],
  );
  const [paymentcategory, setPaymentcategory] = useState<string>(
    paymentCategoryEnum.options[0],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    // `amount` is a numeric *string* in the shared schema, so it is not
    // run through parseFloat.
    const result = createTransactionQuerySchema.safeParse({
      amount: amount.trim(),
      paymentmethod,
      paymentcategory,
    });

    if (!result.success) {
      await showInfo({
        title: 'Invalid Payment',
        message: result.error.issues[0].message,
        severity: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createDirectTransaction(caseId, result.data);
    } catch (err) {
      setIsSubmitting(false);

      await showInfo({
        title: 'Could Not Save Payment',
        message:
          err instanceof Error ? err.message : 'Failed to record transaction.',
        severity: 'error',
      });
      return;
    }

    // The parent only refreshes its table in onSuccess, so close with the
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
            <label className={labelClass}>Date of death</label>
            <input
              type="date"
              value={paymentdatetime}
              onChange={(e) => setPaymentdatetime(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="payment-category" className={labelClass}>
                Category
              </label>
              <select
                id="payment-category"
                value={paymentcategory}
                onChange={(e) => setPaymentcategory(e.target.value)}
                className={`${fieldClass} cursor-pointer`}
              >
                {paymentCategoryEnum.options.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="payment-method" className={labelClass}>
                Method
              </label>
              <select
                id="payment-method"
                value={paymentmethod}
                onChange={(e) => setPaymentmethod(e.target.value)}
                className={`${fieldClass} cursor-pointer`}
              >
                {paymentMethodEnum.options.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
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
