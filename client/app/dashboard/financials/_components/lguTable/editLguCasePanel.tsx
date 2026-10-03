'use client';

import { useState } from 'react';
import { updateLguCase } from '@/services/lguCasesService';
import { useInfoModal } from '@/components/infoModal/useInfoModal';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import LoadingButton from '@/components/loadingButton';
import { fieldClass, labelClass } from '@/components/formStyles';
import { titleCase } from '@/utils/format';
import {
  lguCaseSchema,
  updateLguCaseQuerySchema,
  type GetLguCasesRow,
} from 'shared';

/**
 * Slide-in panel for editing an LGU case's reimbursement status and amount.
 */
export default function EditLguCasePanel({
  lguCase,
  onClose,
  onSuccess,
}: {
  lguCase: GetLguCasesRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const { infoModal, showInfo } = useInfoModal();

  const [status, setStatus] = useState<string>(lguCase.reimbursementstatus);
  const [amount, setAmount] = useState(String(lguCase.reimbursementamount));
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const result = updateLguCaseQuerySchema.safeParse({
      reimbursementstatus: status,
      reimbursementamount: Number(amount),
    });

    if (!result.success) {
      await showInfo({
        title: 'Invalid Reimbursement',
        message: result.error.issues[0].message,
        severity: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await updateLguCase(lguCase.lgucaseid, result.data);
    } catch (err) {
      setIsSubmitting(false);
      await showInfo({
        title: 'Could Not Save Changes',
        message:
          err instanceof Error ? err.message : 'Failed to update LGU case.',
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
      ariaLabel="Edit LGU reimbursement"
      badge={`CASE #${lguCase.caseid}`}
      badgeClassName="bg-orange-100 text-orange-800"
      title="Edit Reimbursement"
      subtitle={lguCase.deceased_name}
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label htmlFor="lgu-status" className={labelClass}>
              Reimbursement status
            </label>
            <select
              id="lgu-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${fieldClass} cursor-pointer`}
            >
              {lguCaseSchema.shape.reimbursementstatus.options.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="lgu-amount" className={labelClass}>
              Reimbursement amount (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ₱
              </span>
              <input
                id="lgu-amount"
                type="number"
                required
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${fieldClass} pl-7`}
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
              label="Save changes"
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
