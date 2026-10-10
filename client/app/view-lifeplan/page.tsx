'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2 } from 'lucide-react';
import type { GetLifeplansQueryRow } from 'shared';
import DataTable from '@/components/dataTable';
import type { DataTableColumn } from '@/components/dataTable/types';
import Footer from '@/components/footer';
import { authClient } from '@/lib/auth-client';
import { getMyLifeplans } from '@/services/lifeplansService';
import { formatCurrency } from '@/utils/format';

type ColumnKey = keyof GetLifeplansQueryRow;

const COLUMNS: DataTableColumn<GetLifeplansQueryRow, ColumnKey>[] = [
  {
    key: 'planholdername',
    label: 'Plan holder',
    widthClassName: 'w-45',
    cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
    render: (l) => l.planholdername ?? '—',
  },
  {
    key: 'plannumber',
    label: 'Plan number',
    widthClassName: 'w-35',
    render: (l) => l.plannumber ?? '—',
  },
  {
    key: 'deceased_name',
    label: 'Deceased name',
    widthClassName: 'w-45',
    cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
    render: (l) => l.deceased_name,
  },
  {
    key: 'totalamount',
    label: 'Total amount',
    widthClassName: 'w-35',
    render: (l) =>
      l.totalamount != null ? formatCurrency(l.totalamount) : '—',
  },
];

function FullPageLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <span className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 size={20} className="animate-spin text-indigo-600" />
        Loading...
      </span>
    </div>
  );
}

export default function ViewLifeplanPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAgent = role === 'lifeplan_agent';

  useEffect(() => {
    if (isPending) return;
    if (!session) router.replace('/');
    else if (!isAgent) router.replace('/dashboard');
  }, [isPending, session, isAgent, router]);

  if (isPending || !session || !isAgent) return <FullPageLoader />;

  async function handleLogout() {
    await authClient.signOut();
    router.push('/');
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 bg-white">
        <span className="flex items-center gap-2 font-semibold text-indigo-600 text-sm sm:text-base">
          <Building2 size={18} /> Villa Elisa Funeral Home
        </span>
        <button
          onClick={handleLogout}
          className="text-xs sm:text-sm font-bold text-gray-500 hover:text-indigo-600 cursor-pointer"
        >
          Log Out
        </button>
      </header>

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
            LIFE PLAN AGENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Your life plans
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Life plans belonging to your company.
          </p>
        </div>

        <DataTable<GetLifeplansQueryRow, ColumnKey>
          title="Life plans"
          countLabel={(total) => `${total} plans`}
          searchPlaceholder="Search by plan holder or number..."
          columns={COLUMNS}
          rowKey={(l) => l.planid}
          defaultSortBy="planholdername"
          defaultSortOrder="asc"
          fetchData={({ filters: _filters, ...params }) =>
            getMyLifeplans(params)
          }
          emptyMessage="No life plans found."
          loadErrorMessage="Could not load life plans. Try again."
          bodyOffsetClassName="top-12"
        />
      </main>

      <Footer />
    </div>
  );
}
