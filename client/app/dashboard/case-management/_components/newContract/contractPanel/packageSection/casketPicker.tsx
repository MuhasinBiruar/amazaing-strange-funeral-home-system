import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CasketInventory } from 'shared';
import { getCasketInventory } from '@/services/casketInventoryService';
import { labelClass } from '../../../fieldStyles';
import type { PackageType } from './types';

function CasketRow({
  casket,
  isSelected,
  onSelect,
}: {
  casket: CasketInventory;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const outOfStock = casket.currentstock <= 0;

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={onSelect}
      className={`w-full text-left rounded-md border px-3 py-2 transition flex items-center justify-between gap-2 ${
        outOfStock
          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
          : isSelected
            ? 'border-indigo-400 bg-indigo-50 cursor-pointer'
            : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
      }`}
    >
      <span
        className={`text-sm font-medium ${outOfStock ? 'text-gray-300' : 'text-gray-900'}`}
      >
        {casket.caskettype}
      </span>
      {outOfStock ? (
        <span className="text-[10px] font-semibold text-red-400 uppercase shrink-0">
          No stock
        </span>
      ) : (
        <span className="text-xs text-gray-400 shrink-0">
          {casket.currentstock} in stock
        </span>
      )}
    </button>
  );
}

/**
 * Casket picker for the package builder. Caskets whose `packagetier` matches
 * the package's own `packagetype` are shown first (that's the natural fit),
 * but every casket stays visible and selectable below — staff can still
 * override it. Out-of-stock caskets are grayed out and unselectable.
 */
export default function CasketPicker({
  packagetype,
  value,
  onChange,
}: {
  packagetype: PackageType | '';
  value: CasketInventory | null;
  onChange: (casket: CasketInventory) => void;
}) {
  const [caskets, setCaskets] = useState<CasketInventory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchCaskets() {
      try {
        setCaskets(await getCasketInventory(controller.signal));
      } catch (err) {
        if (controller.signal.aborted) return;

        console.error('Failed to load casket inventory:', err);
        setError('Could not load caskets.');
      }
    }
    fetchCaskets();

    return () => controller.abort();
  }, []);

  return (
    <div>
      <label className={labelClass}>Casket</label>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {!error && caskets === null && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
          <Loader2 size={14} className="animate-spin" />
          Loading caskets...
        </div>
      )}

      {!error && caskets !== null && caskets.length === 0 && (
        <p className="text-sm text-gray-400">No caskets in inventory.</p>
      )}

      {!error && caskets !== null && caskets.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-3 -mx-1 px-1">
          {(() => {
            const matching = caskets.filter(
              (c) => c.packagetier === packagetype,
            );
            const others = caskets.filter(
              (c) => c.packagetier !== packagetype,
            );

            return (
              <>
                {matching.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      {packagetype} tier
                    </p>
                    {matching.map((casket) => (
                      <CasketRow
                        key={casket.casketid}
                        casket={casket}
                        isSelected={value?.casketid === casket.casketid}
                        onSelect={() => onChange(casket)}
                      />
                    ))}
                  </div>
                )}

                {others.length > 0 && (
                  <div className="space-y-1.5">
                    {matching.length > 0 && (
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                        Other caskets
                      </p>
                    )}
                    {others.map((casket) => (
                      <CasketRow
                        key={casket.casketid}
                        casket={casket}
                        isSelected={value?.casketid === casket.casketid}
                        onSelect={() => onChange(casket)}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
