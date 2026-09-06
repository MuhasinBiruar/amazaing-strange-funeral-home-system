'use client';

import { useRouter } from 'next/navigation';
import {
  Wallet,
  AlertTriangle,
  FileSignature,
  UserPlus,
  ClipboardCheck,
  ChevronRight,
} from "lucide-react";



const modules = [
  {
    section: "Daily Work",
    name: "Intake & Profiling",
    description: "Start a new client profile",
    icon: UserPlus,
    routeTo: "/intake",
  },
  {
    section: "Daily Work",
    name: "Contracting",
    description: "Create or manage contracts",
    icon: FileSignature,
    routeTo: "/contracts",
  },
  {
    section: "Operations",
    name: "Special Cases",
    description: "Review flagged cases",
    icon: AlertTriangle,
    routeTo: "/dashboard",
  },
  {
    section: "Operations",
    name: "Inventory Audits",
    description: "Check inventory records",
    icon: ClipboardCheck,
    routeTo: "/dashboard",
  },
  {
    section: "Finance",
    name: "Financial Dashboard",
    description: "View payments and balances",
    icon: Wallet,
    routeTo: "/dashboard",
  },
];

/**
 * Login page for staff/admin sign-in via username and password.
 *
 * Renders a login form, then on successful authentication shows a
 * welcome modal (name + job role) before the user proceeds to the
 * dashboard. Canceling the modal signs the user back out rather than
 * just dismissing it.
 *
 * @remarks
 * the login form itself performs no client-side redirect until
 * the user clicks "Proceed" on the welcome modal.
 */
export default function DashboardPage() {
  const router = useRouter();
  return (
    <PageGuard>
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-5xl mx-auto overflow-hidden">
          <div className="text-left sm:text-center pt-5 sm:pt-8 pb-4 px-4 sm:px-6">
            <h1 className="text-xl sm:text-2xl font-bold text-indigo-900">Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Choose a service to get started.</p>
          </div>
          <div className="space-y-7 px-4 sm:px-6 pb-6 sm:pb-8">
            {["Daily Work", "Operations", "Finance"].map((section) => (
              <section key={section} aria-labelledby={`${section}-heading`}>
                <h2
                  id={`${section}-heading`}
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
                >
                  {section}
                </h2>
                <div className="divide-y divide-gray-200 border-y border-gray-200">
                  {modules
                    .filter((module) => module.section === section)
                    .map(({ name, description, icon: Icon, routeTo }) => (
                      <button
                        key={name}
                        className="group flex w-full cursor-pointer items-center gap-3 py-3.5 text-left transition hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                        onClick={() => router.push(routeTo)}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-gray-800">
                            {name}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            {description}
                          </span>
                        </span>
                        <ChevronRight
                          size={18}
                          className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </PageGuard>
  );
}
