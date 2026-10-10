'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';
import { casketTierEnum, type CasketInventory } from 'shared';
import { fieldClass, labelClass } from '@/components/formStyles';
import { getCasketInventory } from '@/services/casketInventoryService';
import CasketForm from '../casketForm';

const tierOf = (casket: CasketInventory) => casket.caskettier ?? 'No tier';

/**
 * Casket picker for recording a delivery: a searchable list grouped by tier,
 * with each casket's stock, plus adding a new casket. (Editing and deleting
 * caskets is done from the casket inventory table instead.)
 *
 * @remarks
 * Unlike the package builder's picker, out-of-stock caskets stay selectable,
 * since a delivery is how they get restocked.
 */
export default function CasketSelector({
  selected,
  onChange,
}: {
  selected: CasketInventory | null;
  onChange: (casket: CasketInventory) => void;
}) {
  const [caskets, setCaskets] = useState<CasketInventory[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getCasketInventory(controller.signal)
      .then(setCaskets)
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load caskets:', err);
        setLoadError('Could not load caskets. Close the panel and try again.');
      });
    return () => controller.abort();
  }, []);

  /** A new casket is what the user is about to deliver, so select it. */
  function handleCreated(casket: CasketInventory) {
    setCaskets((prev) => [...(prev ?? []), casket]);
    setIsCreating(false);
    onChange(casket);
  }

  if (loadError) return <p className="text-sm text-red-600">{loadError}</p>;

  if (caskets === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin text-indigo-600" />
        Loading caskets...
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const visible = caskets
    .filter(
      (c) =>
        !query ||
        c.caskettype.toLowerCase().includes(query) ||
        c.caskettier?.toLowerCase().includes(query),
    )
    .sort((a, b) => a.caskettype.localeCompare(b.caskettype));
  // Known tiers in their usual order, then anything else (older free-text
  // tiers, or none) after them.
  const knownTiers: readonly string[] = casketTierEnum.options;
  const otherTiers = [...new Set(visible.map(tierOf))]
    .filter((tier) => !knownTiers.includes(tier))
    .sort();
  const groups = [...knownTiers, ...otherTiers]
    .map((tier) => ({
      tier,
      rows: visible.filter((c) => tierOf(c) === tier),
    }))
    .filter((group) => group.rows.length > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <span className={labelClass}>Casket</span>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer mb-1"
          >
            <Plus size={14} />
            New casket
          </button>
        )}
      </div>

      {isCreating ? (
        <CasketForm
          editor={{ mode: 'create' }}
          onCancel={() => setIsCreating(false)}
          onSaved={handleCreated}
        />
      ) : (
        <>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              placeholder="Search casket or tier..."
              className={`${fieldClass} pl-8`}
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-3 -mx-1 px-1">
            {groups.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">
                {caskets.length === 0
                  ? 'No caskets yet. Add one with "New casket".'
                  : 'No caskets match your search.'}
              </p>
            ) : (
              groups.map(({ tier, rows }) => (
                <div key={tier} className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    {tier}
                  </p>
                  {rows.map((casket) => {
                    const isSelected = selected?.casketid === casket.casketid;
                    const isLow =
                      casket.currentstock <= casket.minimumthreshold;
                    return (
                      <button
                        key={casket.casketid}
                        type="button"
                        onClick={() => onChange(casket)}
                        aria-pressed={isSelected}
                        className={`w-full text-left rounded-md border px-3 py-2 flex items-center justify-between gap-2 transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {casket.caskettype}
                        </span>
                        <span
                          className={`text-xs shrink-0 ${isLow ? 'text-red-500 font-medium' : 'text-gray-400'}`}
                        >
                          {casket.currentstock} in stock
                          {isLow && ' · low'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
