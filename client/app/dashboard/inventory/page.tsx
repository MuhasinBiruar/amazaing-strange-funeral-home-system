'use client';

import { useState } from 'react';

type Tab = 'inventory' | 'delivery';

const TABS: { key: Tab; label: string }[] = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'delivery', label: 'Delivery' },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');

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
                onClick={() => setActiveTab(key)}
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
      </main>
    </div>
  );
}
