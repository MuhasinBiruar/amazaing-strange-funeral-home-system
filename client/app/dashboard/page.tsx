'use client';

import { useRouter } from 'next/navigation';
import {
  Wallet,
  AlertTriangle,
  FileSignature,
  UserPlus,
  ClipboardCheck,
  UserStar,
} from 'lucide-react';

const modules = [
  { name: 'Intake & Profiling', icon: UserPlus, routeTo: '/dashboard/intake' },
  { name: 'Contracting', icon: FileSignature, routeTo: '/dashboard/contracts' },
  { name: 'Financial Dashboard', icon: Wallet, routeTo: '/dashboard' },
  { name: 'Special Cases', icon: AlertTriangle, routeTo: '/dashboard' },
  { name: 'Inventory Audits', icon: ClipboardCheck, routeTo: '/dashboard' },
  { name: 'Admin', icon: UserStar, routeTo: '/dashboard/admin' },
  // { name: "Daily Payments", icon: RefreshCcw },
  // { name: "Document Hub", icon: FolderOpen },
  // { name: "Basic Inventory", icon: Package },
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
    // <PageGuard>
    <div className="min-h-dvh bg-white flex flex-col">
      {/* <Header /> */}
      <main className="flex-1 flex flex-col w-[92vw] lg:w-[80vw] mx-auto px-[2vw] pt-[5vh] pb-[4vh] min-h-0">
        <div className="text-left sm:text-center pb-6 shrink-0">
          <h1 className="text-[clamp(1.25rem,1.8vw,2rem)] font-bold text-indigo-900">
            Dashboard
          </h1>
          <p className="text-[clamp(0.75rem,1vw,0.95rem)] text-gray-500 mt-1">
            Choose a service to get started.
          </p>
        </div>
        <div className="flex-1 flex flex-wrap content-stretch justify-center gap-4 w-full">
          {modules.map(({ name, icon: Icon, routeTo }) => (
            <button
              key={name}
              className="grow basis-[45%] sm:basis-[30%] max-w-105 flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 hover:border-indigo-400 hover:shadow-md transition cursor-pointer"
              onClick={() => router.push(routeTo)}
            >
              <span className="flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 w-[clamp(2.25rem,3.5vw,3rem)] h-[clamp(2.25rem,3.5vw,3rem)]">
                <Icon
                  size={18}
                  className="w-[clamp(1.1rem,1.6vw,1.5rem)] h-[clamp(1.1rem,1.6vw,1.5rem)]"
                />
              </span>
              <span className="text-[clamp(0.8rem,1.1vw,1rem)] font-medium text-gray-700 text-center leading-tight">
                {name}
              </span>
            </button>
          ))}
        </div>
      </main>
      {/* <Footer /> */}
    </div>
    // </PageGuard>
  );
}
