'use client';

import { useEffect, useState } from 'react';
import useDebouncedValue from '@/utils/useDebouncedValue';
import { getCases } from '@/services/caseService';
import type { Case } from 'shared';
import { fieldClass, labelClass } from '../fieldStyles';

export default function CaseSearchSelect({
  selected,
  onSelect,
}: {
  selected: Case | null;
  onSelect: (c: Case) => void;
}) {
  const [query, setQuery] = useState('');
  const [dboQuery] = useDebouncedValue(query, 400);
  const [results, setResults] = useState<Case[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!dboQuery) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const controller = new AbortController();
    setIsSearching(true);
    setSearchError(null);

    getCases({
      page: 1,
      limit: 8,
      sortBy: 'deceased_name',
      sortOrder: 'asc',
      search: dboQuery,
      signal: controller.signal,
    })
      .then((res) => setResults(res.data))
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error('Case search failed:', error);
        setSearchError('Could not search cases. Try again.');
        setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSearching(false);
      });

    return () => controller.abort();
  }, [dboQuery]);

  return (
    <div className="relative">
      <label className={labelClass}>Case</label>
      <input
        value={selected ? selected.deceased_name : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search deceased name or case ID..."
        className={fieldClass}
      />

      {isOpen && isSearching && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-400">
          Searching...
        </div>
      )}

      {isOpen && !isSearching && searchError && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-red-500">
          {searchError}
        </div>
      )}

      {isOpen && !isSearching && !searchError && dboQuery && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-400">
          No matching cases.
        </div>
      )}

      {isOpen && !isSearching && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {results.map((c) => (
            <li key={c.caseid}>
              <button
                type="button"
                onClick={() => {
                  onSelect(c);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
              >
                {c.deceased_name} <span className="text-gray-400">#{c.caseid}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <p className="text-[11px] text-gray-400 mt-1">Case #{selected.caseid}</p>
      )}
    </div>
  );
}