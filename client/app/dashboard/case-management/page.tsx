'use client';

import CaseTable from './_components/caseTable';
import NewContract from './_components/newContract';
import { useRouter, useSearchParams } from 'next/navigation';
import z from 'zod';
import { Suspense } from 'react';

// `new-contract` is also linked to from intake (`?tab=new-contract&caseid=`),
// so these keys are part of the page's URL contract.
const tabEnum = z.enum(['view', 'new-contract']).catch('view');
type Tab = z.infer<typeof tabEnum>;

const TABS: { key: Tab; label: string }[] = [
  { key: 'view', label: 'Cases' },
  { key: 'new-contract', label: 'New Contract' },
];

/**
 * @remarks
 * The active tab lives in the `tab` query parameter rather than in component
 * state, so the view survives a reload and is linkable
 * (e.g. `/dashboard/case-management?tab=new-contract`), like the other
 * dashboards' tabs.
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
        <div>
          <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
            CASE MANAGEMENT DASHBOARD
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Cases
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage cases, and put deceased records under contract.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="flex border-b border-gray-200 px-2">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => changeTab(key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition cursor-pointer ${
                  activeTab === key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {activeTab === 'new-contract' ? (
          <NewContract onCreated={() => changeTab('view')} />
        ) : (
          <CaseTable />
        )}
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
