'use client';

import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  FileSignature,
  UserPlus,
  Wallet,
} from 'lucide-react';

const modules = [
  {
    section: 'Daily Work',
    name: 'Intake & Profiling',
    description: 'Start a new client profile',
    icon: UserPlus,
    routeTo: '/dashboard/intake',
  },
  {
    section: 'Daily Work',
    name: 'Contracting',
    description: 'Create or manage contracts',
    icon: FileSignature,
    routeTo: '/dashboard/case-management',
  },
  {
    section: 'Operations',
    name: 'Special Cases',
    description: 'Review flagged cases',
    icon: AlertTriangle,
    routeTo: '/dashboard/case-management',
  },
  {
    section: 'Operations',
    name: 'Inventory Audits',
    description: 'Check inventory records',
    icon: ClipboardCheck,
    routeTo: '/dashboard/case-management',
  },
  {
    section: 'Finance',
    name: 'Financial Dashboard',
    description: 'View payments and balances',
    icon: Wallet,
    routeTo: '/dashboard/case-management',
  },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-7 sm:mb-9">
          <span className="mb-2 inline-block rounded bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
            STAFF WORKSPACE
          </span>
          <h1 className="font-serif text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose a service to get started.
          </p>
        </header>

        <div className="space-y-7">
          {['Daily Work', 'Operations', 'Finance'].map((section) => (
            <section key={section} aria-labelledby={`${section}-heading`}>
              <h2
                id={`${section}-heading`}
                className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
              >
                {section}
              </h2>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                {modules
                  .filter((module) => module.section === section)
                  .map(
                    (
                      { name, description, icon: Icon, routeTo },
                      index,
                      sectionModules,
                    ) => (
                      <button
                        key={name}
                        type="button"
                        className={`group flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:px-5 ${
                          index < sectionModules.length - 1
                            ? 'border-b border-gray-200'
                            : ''
                        }`}
                        onClick={() => router.push(routeTo)}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-gray-800">
                            {name}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            {description}
                          </span>
                        </span>
                        {name === 'Special Cases' && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                            3
                          </span>
                        )}
                        <ChevronRight
                          size={18}
                          className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                          aria-hidden="true"
                        />
                      </button>
                    ),
                  )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
