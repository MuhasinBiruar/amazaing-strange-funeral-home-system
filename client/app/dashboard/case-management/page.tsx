'use client';

import { ArrowLeft, Plus } from 'lucide-react';
import CaseTable from './_components/caseTable';
import NewContract from './_components/newContract';
import { useRouter, useSearchParams } from 'next/navigation';
import z from 'zod';
import { Suspense } from 'react';

const tabEnum = z.enum(['view', 'new-contract']).catch('view');
type Tab = z.infer<typeof tabEnum>;

/**
 * Case management: the log of existing cases, and the entry point for putting a
 * deceased record under contract.
 *
 * @remarks
 * The active tab lives in the `tab` query parameter rather than in component
 * state, so the view survives a reload and is linkable. "New contract" swaps
 * the case table for a picker of deceased records that have no contract yet,
 * rather than navigating away. Because the two views are rendered
 * conditionally, returning to the cases tab after a contract is created
 * remounts `CaseTable`, so the record - now a case for the first time -
 * appears in the log.
 */
function CasesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = tabEnum.parse(searchParams.get('tab'));
  const changeTab = (tabName: Tab) => {
    router.replace(`/dashboard/case-management?tab=${tabName}`, {
      scroll: false,
    });
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
              CASE MANAGEMENT
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              {activeTab === 'new-contract' ? 'New contract' : 'Cases'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === 'new-contract'
                ? 'Select a deceased record to put under contract.'
                : 'Review and manage case details, documents, and agreements.'}
            </p>
          </div>

          {activeTab === 'new-contract' ? (
            <button
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition shrink-0 hover:cursor-pointer"
              onClick={() => changeTab('view')}
            >
              <ArrowLeft size={16} />
              Back to cases
            </button>
          ) : (
            <button
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition shrink-0 hover:cursor-pointer"
              onClick={() => changeTab('new-contract')}
            >
              <Plus size={16} />
              New contract
            </button>
          )}
        </div>
        {activeTab === 'new-contract' ? (
          <NewContract onCreated={() => changeTab('view')} />
        ) : (
          <CaseTable />
        )}{' '}
      </main>
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={null}>
      <CasesPageContent />
    </Suspense>
  );
}
