'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useInfoModal } from '@/hooks/useInfoModal';
import { getStaffDetail } from '@/services/staffService';
import type { AccessPage } from 'shared';

/**
 * Routes that require the `admin` role, independent of any `access` flag.
 */
const ADMIN_ONLY_PATHS = ['/dashboard/admin'];

/**
 * Dashboard route prefix -> the `access` column that guards it. Routes not
 * listed here (or in {@link ADMIN_ONLY_PATHS}) just require being logged in.
 *
 * Admins bypass this check.
 */
const PATH_ACCESS_MAP: Record<string, AccessPage> = {
  '/dashboard/intake': 'intake_page',
  '/dashboard/case-management': 'case_page',
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
 * Admins skip all page-level access checks.
 *
 * This is UX only, not security — the server independently enforces auth
 * and access on every endpoint.
 */
export default function PageGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const { infoModal, showInfo } = useInfoModal();

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecking(true);
    setAuthorized(false);

    async function check() {
      const { data, error } = await authClient.getSession();
      if (cancelled) return;

      if (!data || error) {
        await showInfo({
          title: 'Not signed in',
          message: 'You must be logged in to view this page.',
          severity: 'error',
        });
        if (!cancelled) router.push('/');
        return;
      }

      const user = data.user as unknown as { id: string; role?: string };
      const isAdmin = user.role === 'admin';
      const isAdminOnlyPath = ADMIN_ONLY_PATHS.some((p) =>
        pathname.startsWith(p),
      );

      if (isAdminOnlyPath && !isAdmin) {
        await showInfo({
          title: 'Access denied',
          message: "You don't have permission to view this page.",
          severity: 'error',
        });
        if (!cancelled) router.push('/dashboard');
        return;
      }

      const requiredPage = accessPageFor(pathname);

      if (requiredPage && !isAdmin) {
        try {
          const detail = await getStaffDetail(user.id);
          if (cancelled) return;

          if (!detail.access[requiredPage]) {
            await showInfo({
              title: 'Access denied',
              message: "You don't have permission to view this page.",
              severity: 'error',
            });
            if (!cancelled) router.push('/dashboard');
            return;
          }
        } catch (err) {
          if (cancelled) return;

          console.error('Failed to verify page access:', err);
          await showInfo({
            title: 'Something went wrong',
            message: 'Could not verify your access. Please try again.',
            severity: 'error',
          });
          if (!cancelled) router.push('/dashboard');
          return;
        }
      }

      if (!cancelled) {
        setAuthorized(true);
        setChecking(false);
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [router, pathname, showInfo]);

  if (checking || !authorized)
    return (
      <div className="grow flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
        {infoModal}
      </div>
    );

  return <>{children}</>;
}
