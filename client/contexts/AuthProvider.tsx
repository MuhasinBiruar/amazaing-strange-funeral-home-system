'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { authClient } from '@/lib/auth-client';
import { getStaffDetail } from '@/services/staffService';
import type { UpdateAccessQuery } from 'shared';

interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  userId: string | null;
  jobRole: string | null;
  isAdmin: boolean;
  access: UpdateAccessQuery | null;
  refresh: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Fetches the session (and, for non-admins, the `access` row) once and
 * shares it via context, so navigating between dashboard pages doesn't
 * re-hit the server each time. Call `refresh()` to force a re-fetch (e.g.
 * after logging in, or after an admin edits their own access).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'refresh'>>({
    status: 'loading',
    userId: null,
    jobRole: null,
    isAdmin: false,
    access: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((prev) => ({ ...prev, status: 'loading' }));

    async function load() {
      const { data, error } = await authClient.getSession();
      if (cancelled) return;

      if (!data || error) {
        setState({
          status: 'unauthenticated',
          userId: null,
          jobRole: null,
          isAdmin: false,
          access: null,
        });
        return;
      }

      const user = data.user as unknown as {
        id: string;
        username?: string;
        role?: string;
        jobRole?: string;
      };
      const isAdmin = user.role === 'admin';
      const jobRole = user.jobRole ?? null;

      if (isAdmin) {
        setState({
          status: 'authenticated',
          userId: user.id,
          jobRole,
          isAdmin,
          access: null,
        });
        return;
      }

      try {
        const detail = await getStaffDetail(user.id);
        if (cancelled) return;
        setState({
          status: 'authenticated',
          userId: user.id,
          jobRole,
          isAdmin,
          access: detail.access,
        });
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load access flags:', err);
        setState({
          status: 'authenticated',
          userId: user.id,
          jobRole,
          isAdmin,
          access: null,
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <AuthContext.Provider value={{ ...state, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
