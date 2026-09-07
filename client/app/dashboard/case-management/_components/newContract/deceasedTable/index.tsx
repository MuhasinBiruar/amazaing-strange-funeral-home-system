import { useState, useEffect } from 'react';
import type { ColumnKey, NullableDeceasedStatus, SortOrder } from './types';
import useDebouncedState from '@/utils/useDebouncedValue';
import useDynamicLimit from '@/utils/useDynamicLimit';
import useElementHeight from '@/utils/useElementHeight';
import TableHeader from './tableHeader';
import TableFooter from '../../table/tableFooter';
import TableBody from './tableBody';
import type { UncontractedDeceased } from 'shared';
import { getUncontractedDeceased } from '@/services/deceasedRecordService';

const SEARCH_DEBOUNCE_MS = 500 as const;
const ROW_HEIGHT_PX = 45 as const;

/**
 * Paginated, searchable table of deceased records that have no contract yet.
 *
 * @remarks
 * `refreshKey` is bumped by the parent after a contract is created so the newly
 * contracted record drops out of the list.
 */
export default function DeceasedTable({
  selectedCaseId,
  onSelect,
  refreshKey,
}: {
  selectedCaseId: number | null;
  onSelect: (record: UncontractedDeceased) => void;
  refreshKey: number;
}) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<ColumnKey>('caseid');
  const [sortOrder, setSortDir] = useState<SortOrder>('desc');
  const [deceasedStatus, setDeceasedStatus] =
    useState<NullableDeceasedStatus>(null);
  const [page, setPage] = useState(1);

  const [headerWrapRef, headerHeight] = useElementHeight<HTMLDivElement>();
  const [theadRef, theadHeight] = useElementHeight<HTMLTableSectionElement>();
  const [footerWrapRef, footerHeight] = useElementHeight<HTMLDivElement>();

  const [records, setRecords] = useState<UncontractedDeceased[]>([]);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dboSearch, commitDboSearch] = useDebouncedState(
    search,
    SEARCH_DEBOUNCE_MS,
  );

  const chromeHeight = headerHeight + theadHeight + footerHeight;

  const [containerRef, limit] = useDynamicLimit<HTMLDivElement>({
    rowHeight: ROW_HEIGHT_PX,
    chromeHeight,
    outsideChromeSelector: 'footer',
    minLimit: 2,
    maxLimit: 50,
  });

  // Reset page if search or limit changes.
  const [prevDboSearch, setPrevDboSearch] = useState(dboSearch);
  if (dboSearch !== prevDboSearch) {
    setPrevDboSearch(dboSearch);
    setPage(1);
  }

  const [prevLimit, setPrevLimit] = useState(limit);
  if (limit !== prevLimit) {
    setPrevLimit(limit);
    setPage(1);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function fetchUncontractedDeceased() {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const res = await getUncontractedDeceased({
          page,
          limit,
          sortBy,
          sortOrder,
          status: deceasedStatus || undefined,
          search: dboSearch,
          signal: controller.signal,
        });

        setRecords(res.data);
        setTotal(res.meta.total);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Failed to load deceased records:', error);
        setErrorMsg('Could not load deceased records. Try again.');
        setRecords([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    fetchUncontractedDeceased();

    return () => controller.abort();
  }, [dboSearch, sortBy, sortOrder, page, limit, deceasedStatus, refreshKey]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-gray-200 bg-white overflow-hidden"
    >
      <div ref={headerWrapRef}>
        <TableHeader
          total={total}
          search={search}
          setSearch={setSearch}
          deceasedStatus={deceasedStatus}
          setDeceasedStatus={setDeceasedStatus}
          setPage={setPage}
          commitDboSearch={commitDboSearch}
        />
      </div>

      <TableBody
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDir={sortOrder}
        setSortDir={setSortDir}
        setPage={setPage}
        records={records}
        errorMsg={errorMsg}
        isLoading={isLoading}
        theadRef={theadRef}
        selectedCaseId={selectedCaseId}
        onSelect={onSelect}
      />

      <div ref={footerWrapRef}>
        <TableFooter
          page={page}
          setPage={setPage}
          total={total}
          limit={limit}
        />
      </div>
    </div>
  );
}
