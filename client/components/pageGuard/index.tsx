'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useInfoModal } from '@/hooks/useInfoModal';
import { useAuth } from '@/contexts/AuthProvider';
import type { AccessPage } from 'shared';

/** Routes that require the `admin` role, independent of any `access` flag. */
const ADMIN_ONLY_PATHS = ['/dashboard/admin'];

/**
 * Dashboard route prefix -> the `access` column that guards it. Routes not
 * listed here (or in {@link ADMIN_ONLY_PATHS}) just require being logged in.
 */
const PATH_ACCESS_MAP: Record<string, AccessPage> = {
  '/dashboard/intake': 'intake_page',
  '/dashboard/case-management': 'case_page',
  '/dashboard/inventory': 'inventory_page',
};

function accessPageFor(pathname: string): AccessPage | null {
  const match = Object.entries(PATH_ACCESS_MAP).find(([prefix]) =>
    pathname.startsWith(prefix),
  );
  return match ? match[1] : null;
}

/**
 * Guards a dashboard route: redirects to `/` if not signed in, or to
 * `/dashboard` if the route needs a role/access the user doesn't have.
 *
 * Admins skip all page-level access checks.
 */
export default function PageGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, isAdmin, access } = useAuth();
  const { infoModal, showInfo } = useInfoModal();

  const isAdminOnlyPath = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
  const requiredPage = accessPageFor(pathname);
  const denied =
    status === 'authenticated' &&
    ((isAdminOnlyPath && !isAdmin) ||
      (!!requiredPage && !isAdmin && !access?.[requiredPage]));

  useEffect(() => {
    if (status === 'unauthenticated') {
      showInfo({
        title: 'Not signed in',
        message: 'You must be logged in to view this page.',
        severity: 'error',
      }).then(() => router.push('/'));
      return;
    }

    if (denied) {
      showInfo({
        title: 'Access denied',
        message: "You don't have permission to view this page.",
        severity: 'error',
      }).then(() => router.push('/dashboard'));
    }
  }, [status, denied, router, showInfo]);

  if (status === 'loading' || status === 'unauthenticated' || denied)
    return (
      <div className="grow flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
        {infoModal}
      </div>
    );

  return <>{children}</>;
}
