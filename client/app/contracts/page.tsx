'use client';

import { Plus } from 'lucide-react';
import Header from '../components/header/header';
import Footer from '../components/footer/footer';
import { usePathname, useRouter } from 'next/navigation';
import CaseTable from './_components/caseTable';

export default function ContractsPage() {
  const router = useRouter();
  const pathname = usePathname();

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
          <button
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition shrink-0"
            onClick={() => {
              router.push(`${pathname}/create`);
            }}
          >
            <Plus size={16} />
            New contract
          </button>
        </div>

        <CaseTable />
      </main>

      <Footer />
    </div>
  );
}
