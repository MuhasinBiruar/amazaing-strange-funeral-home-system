import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { formatCurrency } from '../../../table/format';
import QuickForm from './quickForm';
import GuidedPicker from './guidedPicker';
import {
  initialPackageDraft,
  isPackageDraftComplete,
  toConfirmedPackage,
  type ConfirmedPackage,
  type PackageDraft,
} from './types';

type Mode = 'create' | 'guided';

/**
 * Attaches a package to this contract. Staff either build a brand new one
 * (flat form) or are guided to an existing one — pick a package type, then
 * choose from the (usually short) list of packages of that type. Once
 * confirmed, collapses into a summary card with an Edit action.
 */
export default function PackageSection({
  confirmed,
  onConfirm,
  onEdit,
}: {
  confirmed: ConfirmedPackage | null;
  onConfirm: (pkg: ConfirmedPackage) => void;
  onEdit: () => void;
}) {
  const [mode, setMode] = useState<Mode>('create');
  const [draft, setDraft] = useState<PackageDraft>(initialPackageDraft);

  if (confirmed) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 flex items-start justify-between gap-3">
        <div className="text-sm min-w-0">
          <p className="font-medium text-gray-900 wrap-break-word flex items-center gap-1.5">
            {confirmed.packagename}
            <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0">
              {confirmed.packageid === null ? 'New' : 'Existing'}
            </span>
          </p>
          <p className="text-xs text-gray-500">
            {confirmed.packagetype} · {formatCurrency(confirmed.price)} ·{' '}
            {confirmed.embalmingperiod}-day embalming
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
          onClick={() => setMode('create')}
          className={`rounded px-3 py-1.5 cursor-pointer transition ${
            mode === 'create'
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

      {mode === 'create' ? (
        <div className="space-y-2">
          <QuickForm draft={draft} setDraft={setDraft} />
          <button
            type="button"
            disabled={!isPackageDraftComplete(draft)}
            onClick={() => {
              const pkg = toConfirmedPackage(draft);
              if (pkg) onConfirm(pkg);
            }}
            className="w-full text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Use this package
          </button>
        </div>
      ) : (
        <GuidedPicker
          onConfirm={onConfirm}
          onCreateInstead={(packagetype) => {
            setDraft((prev) => ({ ...prev, packagetype }));
            setMode('create');
          }}
        />
      )}
    </div>
  );
}
