'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useInfoModal } from '@/components/infoModal/useInfoModal';
import { useAuth } from '@/contexts/AuthProvider';
import type { AccessPage } from 'shared';
import { Loader2 } from 'lucide-react';

/** Routes that require the `admin` role, independent of any `access` flag. */
const ADMIN_ONLY_PATHS = ['/dashboard/admin'];

/** The only area life plan agents may use; staff may not use it. */
const AGENT_HOME = '/view-lifeplan';

/**
 * Dashboard route prefix -> the `access` column that guards it. Routes not
 * listed here (or in {@link ADMIN_ONLY_PATHS}) just require being logged in.
 */
const PATH_ACCESS_MAP: Record<string, AccessPage> = {
  '/dashboard/intake': 'intake_page',
  '/dashboard/case-management': 'case_page',
  '/dashboard/inventory': 'inventory_page',
  '/dashboard/financials': 'financial_page',
};

function accessPageFor(pathname: string): AccessPage | null {
  const match = Object.entries(PATH_ACCESS_MAP).find(([prefix]) =>
    pathname.startsWith(prefix),
  );
  return match ? match[1] : null;
}

/**
 * Guards a route: redirects to `/` if not signed in, or to the user's own
 * home (`/dashboard` for staff, `/view-lifeplan` for life plan agents) if the
 * route needs a role/access they don't have.
 *
 * Admins skip all page-level access checks.
 */
export default function PageGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, isAdmin, access, role } = useAuth();
  const { infoModal, showInfo } = useInfoModal();

  const isAgent = role === 'lifeplan_agent';
  const isAgentPath = pathname.startsWith(AGENT_HOME);
  const isAdminOnlyPath = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
  const requiredPage = accessPageFor(pathname);

  // Agents are quietly sent home; no error needed, it's just not their area.
  const misplacedAgent = status === 'authenticated' && isAgent && !isAgentPath;

  const denied =
    status === 'authenticated' &&
    ((isAgentPath && !isAgent) ||
      (isAdminOnlyPath && !isAdmin) ||
      (requiredPage !== null && !isAdmin && !access?.[requiredPage]));

  useEffect(() => {
    if (status === 'unauthenticated') {
      showInfo({
        title: 'Not signed in',
        message: 'You must be logged in to view this page.',
        severity: 'error',
      }).then(() => router.push('/'));
      return;
    }

    if (misplacedAgent) {
      router.replace(AGENT_HOME);
      return;
    }

    if (denied) {
      showInfo({
        title: 'Access denied',
        message: "You don't have permission to view this page.",
        severity: 'error',
      }).then(() => router.push('/dashboard'));
    }
  }, [status, denied, misplacedAgent, router, showInfo]);

  if (
    status === 'loading' ||
    status === 'unauthenticated' ||
    denied ||
    misplacedAgent
  )
    return (
      <div className="grow flex items-center justify-center bg-white">
        <span className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={20} className="animate-spin text-indigo-600" />
          Loading...
        </span>

        {infoModal}
      </div>
    );

  return <>{children}</>;
}
