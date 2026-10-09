'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import z from 'zod';
import LifeplanCompanyTable from './_components/life-plan/lifeplanCompanyTable';

const tabEnum = z.enum(['inventory', 'delivery']).catch('inventory');
type Tab = z.infer<typeof tabEnum>;

const TABS: { key: Tab; label: string }[] = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'delivery', label: 'Delivery' },
];

function SpecialCasesPageContent() {
  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
            SPECIAL CASES DASHBOARD
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            LGU & LIFE PLAN{' '}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage special cases.</p>
        </div>
        <LifeplanCompanyTable />
      </main>
    </div>
  );
}

export default function SpecialCasesPage() {
  return (
    <Suspense fallback={null}>
      <SpecialCasesPageContent />
    </Suspense>
  );
}
