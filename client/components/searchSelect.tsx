'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import useDebouncedValue from '@/utils/useDebouncedValue';
import { fieldClass, labelClass } from '@/components/formStyles';
import InlineError from '@/components/inlineError';
import type { PaginatedResponse } from 'shared/utils';

const LIMIT = 20 as const;
const SEARCH_DEBOUNCE_MS = 300 as const;

/**
 * Combobox whose options come from a paginated, searchable endpoint.
 *
 * @remarks
 * `value` is the whole selected option, not just an id, so the label can be
 * shown without the option being in the currently loaded page (e.g. when
 * editing a record whose selection sits on page 7).
 */
export default function SearchSelect<T>({
  label,
  placeholder = 'Search...',
  value,
  onChange,
  fetchPage: fetchData,
  getKey,
  getLabel,
  error,
}: {
  label: string;
  placeholder?: string;
  value: T | null;
  onChange: (option: T) => void;
  fetchPage: (params: {
    page: number;
    limit: number;
    search?: string;
    signal?: AbortSignal;
  }) => Promise<PaginatedResponse<T>>;
  getKey: (option: T) => string | number;
  getLabel: (option: T) => string;
  error?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dboQuery] = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // A new search starts over from page 1.
  const [prevDboQuery, setPrevDboQuery] = useState(dboQuery);
  if (dboQuery !== prevDboQuery) {
    setPrevDboQuery(dboQuery);
    setPage(1);
  }

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetchData({
          page,
          limit: LIMIT,
          search: dboQuery || undefined,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setItems((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
        setTotalPages(res.meta.totalPages);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to load options:', err);
        setLoadError('Could not load options. Try again.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    load();

    return () => controller.abort();
    // `fetchPage` is typically an inline closure; it is deliberately not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, dboQuery, page]);

  function close() {
    setIsOpen(false);
    setQuery('');
    setPage(1);
  }

  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input
          role="combobox"
          aria-controls="items-listbox"
          aria-expanded={isOpen}
          value={isOpen ? query : value ? getLabel(value) : ''}
          placeholder={value ? getLabel(value) : placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
          }}
          className={`${fieldClass} pr-8`}
        />
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>

      {isOpen && (
        <div
          id="items-listbox"
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto"
          role="listbox"
        >
          {items.map((item) => (
            <button
              type="button"
              key={getKey(item)}
              onClick={() => {
                onChange(item);
                close();
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer ${
                value && getKey(value) === getKey(item)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700'
              }`}
            >
              {getLabel(item)}
            </button>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" />
              Loading...
            </div>
          )}

          {loadError && (
            <p className="px-3 py-2 text-sm text-red-500">{loadError}</p>
          )}

          {!isLoading && !loadError && items.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">No results.</p>
          )}

          {!isLoading && !loadError && page < totalPages && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="w-full px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-gray-50 cursor-pointer border-t border-gray-100"
            >
              Load more
            </button>
          )}
        </div>
      )}

      <InlineError error={error} />
    </div>
  );
}
