import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Pencil } from 'lucide-react';
import { formatCurrency } from '../../../table/format';
import QuickForm from './quickForm';
import PackageWizard from './wizard';
import { isPackageDraftComplete, type PackageDraft } from './types';

type Mode = 'quick' | 'guided';

/**
 * Builds the package for this contract — every contract gets one created for
 * it here, rather than picking an existing one from a catalog. Staff choose
 * between filling a flat form directly or being walked through it step by
 * step; both write into the same `draft`, so switching modes mid-way never
 * loses progress. Once confirmed, collapses into a summary card with an Edit
 * action.
 */
export default function PackageSection({
  draft,
  setDraft,
  confirmed,
  onConfirm,
  onEdit,
}: {
  draft: PackageDraft;
  setDraft: Dispatch<SetStateAction<PackageDraft>>;
  confirmed: boolean;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  const [mode, setMode] = useState<Mode>('quick');

  if (confirmed) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 flex items-start justify-between gap-3">
        <div className="text-sm min-w-0">
          <p className="font-medium text-gray-900 wrap-break-word">
            {draft.packagename}
          </p>
          <p className="text-xs text-gray-500">
            {draft.packagetype} · {formatCurrency(Number(draft.price))} ·{' '}
            {draft.embalmingperiod}-day embalming
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 shrink-0 cursor-pointer"
        >
          <Pencil size={12} /> Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
        <button
          type="button"
          onClick={() => setMode('quick')}
          className={`rounded px-3 py-1.5 cursor-pointer transition ${
            mode === 'quick'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Create package
        </button>
        <button
          type="button"
          onClick={() => setMode('guided')}
          className={`rounded px-3 py-1.5 cursor-pointer transition ${
            mode === 'guided'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Guided setup
        </button>
      </div>

      {mode === 'quick' ? (
        <div className="space-y-2">
          <QuickForm draft={draft} setDraft={setDraft} />
          <button
            type="button"
            disabled={!isPackageDraftComplete(draft)}
            onClick={onConfirm}
            className="w-full text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Use this package
          </button>
        </div>
      ) : (
        <PackageWizard
          draft={draft}
          setDraft={setDraft}
          onConfirm={onConfirm}
        />
      )}
    </div>
  );
}
