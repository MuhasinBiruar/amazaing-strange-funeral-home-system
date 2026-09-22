'use client';

import { Building2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useAuth } from '@/contexts/AuthProvider';
import { useRouter } from 'next/navigation';
import { useInfoModal } from '@/hooks/useInfoModal';
import { createPortal } from 'react-dom';

export default function Header() {
  const router = useRouter();
  const { jobRole } = useAuth();

  const { infoModal, showInfo } = useInfoModal();

  return (
    <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-700 gap-2 sticky top-0 bg-white/50 backdrop-blur-md z-50">
      <div className="grid grid-rows-2 gap2">
        <div className="flex gap-2 items-start sm:items-center">
          <Building2 size={18} className="text-indigo-600 shrink-0" />
          <span className="font-semibold text-indigo-600 leading-tight text-sm sm:text-base">
            Villa Elisa Funeral Home
          </span>
        </div>
        <button
          onClick={() => router.back()}
          className="w-10 relative flex items-center gap-1 text-xs font-bold sm:text-sm text-gray-500 hover:cursor-pointer hover:text-indigo-600 transition-colors duration-500 hover:underline "
        >
          Back
        </button>
      </div>

      <div className="relative shrink-0 grip grid-row-2">
        <p className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 font-bold">
          Role: <span>{jobRole ?? 'Unknown Role'}</span>
        </p>
        <button
          onClick={async () => {
            const isConfirmed = await showInfo({
              title: 'Log Out?',
              message: 'Are you sure you want to log out?',
              closeLabel: 'Cancel',
              confirmLabel: 'Log Out',
              severity: 'warning',
            });

            if (!isConfirmed) return;

            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push('/');
                },
              },
            });
          }}
          className="relative flex items-center gap-1 text-xs font-bold sm:text-sm text-gray-500 hover:cursor-pointer hover:text-indigo-600 transition-colors duration-500 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-px after:w-full after:bg-indigo-600 after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-500 after:ease-in-out"
        >
          Log Out
        </button>
      </div>

      {createPortal(infoModal, document.body)}
    </div>
  );
}
