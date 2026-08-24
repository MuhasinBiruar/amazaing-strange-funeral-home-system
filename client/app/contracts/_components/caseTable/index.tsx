import { useState, useEffect } from 'react';
import type { ColumnKey, NullableDeceasedStatus, SortOrder } from './types';
import useDebouncedState from '@/utils/useDebouncedValue';
import TableHeader from './tableHeader';
import TableFooter from './tableFooter';
import TableBody from './tableBody';
import type { Case } from 'shared';
import { getCases } from '@/app/services/caseService';

const SEARCH_DEBOUNCE_MS = 500 as const;

export default function CaseTable() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<ColumnKey>('caseid');
  const [sortOrder, setSortDir] = useState<SortOrder>('desc');
  const [deceasedStatus, setDeceasedStatus] =
    useState<NullableDeceasedStatus>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dboSearch, commitDboSearch] = useDebouncedState(
    search,
    SEARCH_DEBOUNCE_MS,
  );

  const [prevDboSearch, setPrevDboSearch] = useState(dboSearch);
  if (dboSearch !== prevDboSearch) {
    setPrevDboSearch(dboSearch);
    setPage(1);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPaginatedContracts() {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const res = await getCases({
          page,
          limit,
          sortBy,
          sortOrder,
          status: deceasedStatus || undefined,
          search: dboSearch,
          signal: controller.signal,
        });

        setCases(res.data);
        setTotal(res.meta.total);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Failed to load contracts:', error);
        setErrorMsg('Could not load contracts. Try   again.');
        setCases([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    fetchPaginatedContracts();

    return () => controller.abort();
  }, [dboSearch, sortBy, sortOrder, page, limit, deceasedStatus]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <TableHeader
        total={total}
        search={search}
        setSearch={setSearch}
        deceasedStatus={deceasedStatus}
        setDeceasedStatus={setDeceasedStatus}
        setPage={setPage}
        commitDboSearch={commitDboSearch}
      />

      <TableBody
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDir={sortOrder}
        setSortDir={setSortDir}
        setPage={setPage}
        cases={cases}
        errorMsg={errorMsg}
        isLoading={isLoading}
      />

      <TableFooter page={page} setPage={setPage} total={total} limit={limit} />
    </div>
  );
}
