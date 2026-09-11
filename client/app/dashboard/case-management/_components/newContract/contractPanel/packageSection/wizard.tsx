import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { fieldClass, labelClass } from '../fieldStyles';
import { formatCurrency } from '../../../table/format';
import PackageTypeButtons from './packageTypeButtons';
import type { PackageDraft } from './types';

type StepKey = 'type' | 'name' | 'price' | 'embalmingperiod' | 'inclusions';

const STEPS: { key: StepKey; prompt: string }[] = [
  { key: 'type', prompt: 'What type of package is this?' },
  { key: 'name', prompt: 'What should this package be called?' },
  { key: 'price', prompt: "What's the price?" },
  { key: 'embalmingperiod', prompt: 'How many days for embalming?' },
  { key: 'inclusions', prompt: 'Anything included?' },
];

function isStepValid(key: StepKey, draft: PackageDraft): boolean {
  switch (key) {
    case 'type':
      return draft.packagetype !== '';
    case 'name':
      return draft.packagename.trim() !== '';
    case 'price':
      return draft.price.trim() !== '' && Number(draft.price) >= 0;
    case 'embalmingperiod':
      return (
        draft.embalmingperiod.trim() !== '' &&
        Number(draft.embalmingperiod) >= 0
      );
    case 'inclusions':
      return true;
  }
}

/**
 * Walks staff through building a package one question at a time, ending in a
 * review screen. Shares `draft` with the quick form, so switching modes
 * mid-way keeps whatever has already been filled in.
 */
export default function PackageWizard({
  draft,
  setDraft,
  onConfirm,
}: {
  draft: PackageDraft;
  setDraft: Dispatch<SetStateAction<PackageDraft>>;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState(0);
  const isReview = step >= STEPS.length;
  const current = isReview ? null : STEPS[step];
  const canAdvance = current === null || isStepValid(current.key, draft);

  return (
    <div className="rounded-md border border-gray-200 p-3 space-y-3">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
        {isReview ? 'Review' : `Step ${step + 1} of ${STEPS.length}`}
      </p>

      {current === null ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">
            {draft.packagename || '—'}
          </p>
          <dl className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between gap-3">
              <dt>Type</dt>
              <dd>{draft.packagetype || '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Price</dt>
              <dd>{formatCurrency(Number(draft.price))}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Embalming period</dt>
              <dd>{draft.embalmingperiod} days</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Inclusions</dt>
              <dd className="text-right">{draft.inclusions || '—'}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div>
          <label className={labelClass}>{current.prompt}</label>

          {current.key === 'type' && (
            <PackageTypeButtons
              value={draft.packagetype}
              onChange={(packagetype) =>
                setDraft((prev) => ({ ...prev, packagetype }))
              }
            />
          )}

          {current.key === 'name' && (
            <input
              autoFocus
              value={draft.packagename}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, packagename: e.target.value }))
              }
              placeholder="e.g. Silver Memorial Package"
              className={fieldClass}
            />
          )}

          {current.key === 'price' && (
            <input
              autoFocus
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, price: e.target.value }))
              }
              className={fieldClass}
            />
          )}

          {current.key === 'embalmingperiod' && (
            <input
              autoFocus
              type="number"
              min="0"
              step="1"
              value={draft.embalmingperiod}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  embalmingperiod: e.target.value,
                }))
              }
              className={fieldClass}
            />
          )}

          {current.key === 'inclusions' && (
            <textarea
              autoFocus
              rows={3}
              value={draft.inclusions}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, inclusions: e.target.value }))
              }
              className={`${fieldClass} resize-y`}
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft size={14} /> Back
        </button>

        {isReview ? (
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 cursor-pointer"
          >
            <Check size={14} /> Use this package
          </button>
        ) : (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {step === STEPS.length - 1 ? 'Review' : 'Next'}
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
