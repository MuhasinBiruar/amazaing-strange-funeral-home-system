'use client';

import { ArrowLeft, Building2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useAuth } from '@/contexts/AuthProvider';
import { useRouter } from 'next/navigation';
import { useInfoModal } from '@/components/infoModal/useInfoModal';

export default function Header() {
  const router = useRouter();
  const { role, jobRole } = useAuth();
  const { infoModal, showInfo } = useInfoModal();

  const isAgent = role === 'lifeplan_agent';
  // Agents have no job role, so show their account type instead
  const roleLabel = isAgent ? 'Life plan agent' : (jobRole ?? 'Unknown Role');

  async function handleLogout() {
    await showInfo({
      title: 'Log Out?',
      message: 'Are you sure you want to log out?',
      closeLabel: 'Cancel',
      confirmLabel: 'Log Out',
      severity: 'warning',
      onConfirmAction: () =>
        new Promise<void>((resolve, reject) => {
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push('/');
                resolve();
              },
              onError: ({ error }) =>
                reject(
                  error || new Error('Failed to sign out. Please try again.'),
                ),
            },
          });
        }),
    });
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-gray-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="grid grid-rows-2 min-w-0">
        <span className="flex items-center gap-2 font-semibold text-indigo-600 leading-tight text-sm sm:text-base">
          <Building2 size={18} className="shrink-0" />
          Villa Elisa Funeral Home
        </span>

        {role === null || isAgent ? (
          <span aria-hidden />
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            className="w-fit flex items-center gap-1 text-xs font-bold sm:text-sm text-gray-500 hover:cursor-pointer hover:text-indigo-600 transition-colors duration-500 hover:underline"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        )}
      </div>

      <div className="grid grid-rows-2 justify-items-end shrink-0">
        <p className="text-xs sm:text-sm text-gray-500 font-bold">
          Role: <span>{roleLabel}</span>
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="relative flex items-center gap-1 text-xs font-bold sm:text-sm text-gray-500 hover:cursor-pointer hover:text-indigo-600 transition-colors duration-500 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-px after:w-full after:bg-indigo-600 after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-500 after:ease-in-out"
        >
          Log Out
        </button>
      </div>

      {infoModal}
    </header>
  );
}
