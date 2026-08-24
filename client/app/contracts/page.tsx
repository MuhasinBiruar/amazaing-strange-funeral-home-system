'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Header from '../components/header/header';
import Footer from '../components/footer/footer';
import type { SortableColumnKey, SortDir } from './_components/types';
import type { ContractSchema } from '@/app/services/contractService';
import { getPaginatedContracts } from '@/app/services/contractService';
import useDebouncedState from '@/utils/useDebouncedValue';
import TableHeader from './_components/tableHeader';
import TableFooter from './_components/tableFooter';
import TableBody from './_components/tableBody';

const SEARCH_DEBOUNCE_MS = 500 as const;

export default function ContractsPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortableColumnKey>('contractid');
  const [sortDir, setSortDir] = useState<SortDir>('DESC');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [contracts, setContracts] = useState<ContractSchema[]>([]);
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
        const res = await getPaginatedContracts(
          dboSearch,
          sortBy,
          sortDir,
          page,
          limit,
          {
            signal: controller.signal,
          },
        );

        setContracts(res.data);
        setTotal(res.meta.totalItems);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Failed to load contracts:', error);
        setErrorMsg('Could not load contracts. Try   again.');
        setContracts([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    fetchPaginatedContracts();

    return () => controller.abort();
  }, [dboSearch, sortBy, sortDir, page, limit]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
              CONTRACTING
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              Contracts
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review, draft, and manage service agreements for every case on
              file.
            </p>
          </div>
          <button className="hidden sm:flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition shrink-0">
            <Plus size={16} />
            New contract
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <TableHeader
            total={total}
            search={search}
            setSearch={setSearch}
            commitDboSearch={commitDboSearch}
          />

          <TableBody
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDir={sortDir}
            setSortDir={setSortDir}
            setPage={setPage}
            contracts={contracts}
            errorMsg={errorMsg}
            isLoading={isLoading}
          />

          <TableFooter
            page={page}
            setPage={setPage}
            total={total}
            limit={limit}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
