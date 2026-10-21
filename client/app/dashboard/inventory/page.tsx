'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import z from 'zod';
import CasketTable from './_components/casketTable';
import DeliveryTables, {
  deliveryTypeEnum,
  type DeliveryType,
} from './_components/deliveryTables';

const tabEnum = z.enum(['inventory', 'delivery']).catch('inventory');
type Tab = z.infer<typeof tabEnum>;

const TABS: { key: Tab; label: string }[] = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'delivery', label: 'Delivery' },
];

/**
 * @remarks
 * The active tab lives in the `tab` query parameter rather than in component
 * state, so the view survives a reload and is linkable
 * (e.g. `/dashboard/inventory?tab=delivery`). The Delivery tab's casket /
 * formalin toggle lives in `type` the same way
 * (e.g. `/dashboard/inventory?tab=delivery&type=formalin`).
 */
function InventoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = tabEnum.parse(searchParams.get('tab'));
  const deliveryType = deliveryTypeEnum.parse(searchParams.get('type'));

  const changeTab = (tabName: Tab) => {
    router.replace(`/dashboard/inventory?tab=${tabName}`, { scroll: false });
  };
  const changeDeliveryType = (type: DeliveryType) => {
    router.replace(`/dashboard/inventory?tab=delivery&type=${type}`, {
      scroll: false,
    });
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
            INVENTORY DASHBOARD
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage casket inventory and deliveries.
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
        {activeTab === 'delivery' ? (
          <DeliveryTables
            type={deliveryType}
            onTypeChange={changeDeliveryType}
          />
        ) : (
          <CasketTable />
        )}
      </main>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryPageContent />
    </Suspense>
  );
}
