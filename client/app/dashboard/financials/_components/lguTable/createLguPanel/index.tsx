'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { Case } from 'shared';
import { createLguCase } from '@/services/financialService';
import { fieldClass, labelClass } from '../../fieldStyles';
import CaseSearchSelect from '../../caseSearchSelect';

const PANEL_TRANSITION_MS = 300 as const;

export default function CreateLguPanel({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [reimbursementstatus, setReimbursementstatus] = useState('pending');
  const [reimbursementamount, setReimbursementamount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleClose() {
    setShown(false);
    setTimeout(onClose, PANEL_TRANSITION_MS);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase) {
      setErrorMsg('Pick a case first.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createLguCase({
        caseid: selectedCase.caseid,
        reimbursementstatus,
        reimbursementamount: Number(reimbursementamount),
      });
      onCreated();
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Could not create the LGU case. Try again.',
      );
      setIsSubmitting(false);
    }
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
        aria-label="New LGU case"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-md bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${
          shown ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-serif font-bold text-gray-900">
            New LGU case
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

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <CaseSearchSelect selected={selectedCase} onSelect={setSelectedCase} />

            <div>
              <label htmlFor="reimbursementstatus" className={labelClass}>
                Reimbursement status
              </label>
              <select
                id="reimbursementstatus"
                value={reimbursementstatus}
                onChange={(e) => setReimbursementstatus(e.target.value)}
                className={`${fieldClass} cursor-pointer`}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="released">Released</option>
                <option value="denied">Denied</option>
              </select>
            </div>

            <div>
              <label htmlFor="reimbursementamount" className={labelClass}>
                Reimbursement amount (PHP)
              </label>
              <input
                id="reimbursementamount"
                type="number"
                min="0"
                step="0.01"
                required
                value={reimbursementamount}
                onChange={(e) => setReimbursementamount(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <footer className="px-5 py-4 border-t border-gray-200 shrink-0 space-y-3">
            {errorMsg && (
              <p role="alert" className="text-sm text-red-500">
                {errorMsg}
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedCase}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create LGU case'}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </>
  );
}