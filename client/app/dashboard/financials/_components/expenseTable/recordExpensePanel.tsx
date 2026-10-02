'use client';

import { useState } from 'react';
import axios from 'axios';
import { createExpense } from '@/services/expensesService';
import { extractErrorMessage } from '@/services/utils/extractErrorMessage';
import { useInfoModal } from '@/components/infoModal/useInfoModal';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import LoadingButton from '@/components/loadingButton';
import { createExpenseQuerySchema } from 'shared';
import { fieldClass, labelClass } from '@/components/formStyles';

/** `<input type="date">` wants `yyyy-mm-dd` in the viewer's local time. */
function toDateInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

/**
 * Slide-in panel for recording a general expense.
 */
export default function RecordExpensePanel({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const { infoModal, showInfo } = useInfoModal();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expensedate, setExpensedate] = useState(() =>
    toDateInputValue(new Date()),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    // `amount` is a numeric *string* in the shared schema (bigNumberSchema),
    // so it must not be run through parseFloat before validation.
    const result = createExpenseQuerySchema.safeParse({
      description,
      amount: amount.trim(),
      expensedate,
    });

    if (!result.success) {
      await showInfo({
        title: 'Invalid Expense',
        message: result.error.issues[0].message,
        severity: 'error',
      });
      return;
    }

    if (Number(result.data.amount) <= 0) {
      await showInfo({
        title: 'Invalid Expense Amount',
        message: 'Amount must be greater than zero.',
        severity: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createExpense(result.data);
    } catch (err) {
      setIsSubmitting(false);
      console.error('Error recording expense:', err);

      await showInfo({
        title: 'Could Not Save Expense',
        message:
          axios.isAxiosError(err) && err.response?.data?.error?.message
            ? extractErrorMessage(err.response.data)
            : 'Failed to record expense.',
        severity: 'error',
      });
      return;
    }

    onSuccess();
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Record general expense"
      badge="NEW EXPENSE"
      badgeClassName="bg-red-100 text-red-800"
      title="Record General Expense"
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label htmlFor="expense-description" className={labelClass}>
              Description
            </label>
            <input
              id="expense-description"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Office supplies, snacks..."
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="expense-amount" className={labelClass}>
                Amount (PHP)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  ₱
                </span>
                <input
                  id="expense-amount"
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
              <label htmlFor="expense-date" className={labelClass}>
                Date
              </label>
              <input
                id="expense-date"
                type="date"
                required
                value={expensedate}
                onChange={(e) => setExpensedate(e.target.value)}
                className={fieldClass}
              />
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
              label="Save expense"
              loadingLabel="Saving..."
              className="flex items-center gap-1.5 rounded-lg bg-red-500 text-white text-sm font-medium px-4 py-2 hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
          </div>
        </footer>
      </form>

      {infoModal}
    </SidePanel>
  );
}
