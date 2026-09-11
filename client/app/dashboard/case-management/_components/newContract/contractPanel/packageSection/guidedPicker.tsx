import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Package } from 'shared';
import { getPackages } from '@/services/packageService';
import { labelClass } from '../fieldStyles';
import { formatCurrency } from '../../../table/format';
import PackageTypeButtons from './packageTypeButtons';
import type { ConfirmedPackage, PackageType } from './types';

/**
 * Guided package selection: narrow the catalog down to a package type first,
 * then pick one from the (usually much shorter) filtered list.
 */
export default function GuidedPicker({
  onConfirm,
  onCreateInstead,
}: {
  onConfirm: (pkg: ConfirmedPackage) => void;
  onCreateInstead: (packagetype: PackageType) => void;
}) {
  const [packagetype, setPackagetype] = useState<PackageType | ''>('');
  const [showList, setShowList] = useState(false);
  const [packages, setPackages] = useState<Package[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!showList || packages !== null) return;
    const controller = new AbortController();

    async function fetchPackages() {
      try {
        setPackages(await getPackages(controller.signal));
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Failed to load packages:', error);
        setFetchError('Could not load packages.');
      }
    }
    fetchPackages();

    return () => controller.abort();
  }, [showList, packages]);

  if (!showList) {
    return (
      <div className="rounded-md border border-gray-200 p-3 space-y-3">
        <label className={labelClass}>What type of package is this?</label>
        <PackageTypeButtons value={packagetype} onChange={setPackagetype} />
        <div className="flex justify-end">
          <button
            type="button"
            disabled={packagetype === ''}
            onClick={() => setShowList(true)}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  const matching = (packages ?? []).filter(
    (p) => p.packagetype === packagetype,
  );
  const selected = matching.find((p) => p.packageid === selectedId) ?? null;

  return (
    <div className="rounded-md border border-gray-200 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <label className={labelClass}>{packagetype} packages</label>
        <button
          type="button"
          onClick={() => {
            setShowList(false);
            setSelectedId(null);
          }}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          <ChevronLeft size={14} /> Back
        </button>
      </div>

      {packages === null && !fetchError && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          Loading packages...
        </div>
      )}

      {fetchError && <p className="text-sm text-red-500">{fetchError}</p>}

      {packages !== null && !fetchError && matching.length === 0 && (
        <div className="py-2 space-y-2">
          <p className="text-sm text-gray-500">
            No {packagetype} packages yet.
          </p>
          <button
            type="button"
            onClick={() => onCreateInstead(packagetype as PackageType)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            Create one instead →
          </button>
        </div>
      )}

      {matching.length > 0 && (
        <div className="max-h-56 overflow-y-auto space-y-1.5 -mx-1 px-1">
          {matching.map((p) => (
            <button
              type="button"
              key={p.packageid}
              onClick={() => setSelectedId(p.packageid)}
              className={`w-full text-left rounded-md border px-3 py-2 transition cursor-pointer ${
                selectedId === p.packageid
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <p className="text-sm font-medium text-gray-900">
                {p.packagename}
              </p>
              <p className="text-xs text-gray-500">
                {formatCurrency(p.price)} · {p.embalmingperiod}-day embalming
              </p>
              {p.inclusions && (
                <p className="text-xs text-gray-400 mt-0.5 wrap-break-word">
                  {p.inclusions}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <button
          type="button"
          onClick={() => onConfirm(selected)}
          className="w-full text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 cursor-pointer"
        >
          Use this package
        </button>
      )}
    </div>
  );
}
