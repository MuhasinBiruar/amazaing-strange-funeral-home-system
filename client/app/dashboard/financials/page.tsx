'use client';

import { useState } from 'react';
import SummaryPanel from './_components/summaryPanel';
import DirectTable from './_components/directTable';
import LguTable from './_components/lguTable';
import LifeplanTable from './_components/lifeplanTable';

type Tab = 'direct' | 'lgu' | 'lifeplan';

const TABS: { key: Tab; label: string }[] = [
  { key: 'direct', label: 'Direct' },
  { key: 'lgu', label: 'LGU' },
  { key: 'lifeplan', label: 'Life Plan' },
];

/**
 * Financial dashboard: money-in/money-out summary over time, plus separate
 * logs for Direct, LGU, and Life Plan payment types.
 *
 * @remarks
 * Mirrors the case-management page shell (category pill, serif heading,
 * subtitle) and reuses the shared `DataTable` for each payment type's log.
 */
export default function FinancialsPage() {
  const [tab, setTab] = useState<Tab>('direct');

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
            FINANCIAL DASHBOARD
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Financials
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track money in and out, and manage Direct, LGU, and Life Plan
            payment records.
          </p>
        </div>

        <SummaryPanel />

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="flex border-b border-gray-200 px-2">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition cursor-pointer ${
                  tab === key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'direct' && <DirectTable />}
        {tab === 'lgu' && <LguTable />}
        {tab === 'lifeplan' && <LifeplanTable />}
      </main>
    </div>
  );
}