'use client';

import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import CaseTable from './_components/caseTable';
import NewContract from './_components/newContract';

/**
 * Case management: the log of existing cases, and the entry point for putting a
 * deceased record under contract.
 *
 * @remarks
 * "New contract" swaps the case table for a picker of deceased records that
 * have no contract yet, rather than navigating away. Creating one bumps
 * `caseTableKey`, remounting `CaseTable` so the record — now a case for the
 * first time — appears in the log.
 */
export default function CasesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [caseTableKey, setCaseTableKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
              CASE MANAGEMENT
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              {isCreating ? 'New contract' : 'Cases'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isCreating
                ? 'Select a deceased record to put under contract.'
                : 'Review and manage case details, documents, and agreements.'}
            </p>
          </div>

          {isCreating ? (
            <button
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition shrink-0 hover:cursor-pointer"
              onClick={() => setIsCreating(false)}
            >
              <ArrowLeft size={16} />
              Back to cases
            </button>
          ) : (
            <button
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition shrink-0 hover:cursor-pointer"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={16} />
              New contract
            </button>
          )}
        </div>

        {isCreating ? (
          <NewContract
            onCreated={() => {
              setIsCreating(false);
              setCaseTableKey((k) => k + 1);
            }}
          />
        ) : (
          <CaseTable key={caseTableKey} />
        )}
      </main>
    </div>
  );
}
