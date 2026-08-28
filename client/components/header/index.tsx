'use client';

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [role, setRole] = useState('');
  const [open, setOpen] = useState(false);
  const [clickLogOut, setClickLogOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      console.log('Session data:', data); //remove later
      const user = data?.user as unknown as { jobRole?: string } | undefined;
      setRole(user?.jobRole ?? 'Unknown Role');
    });
  }, []);

  return (
    <div className="flex items-start sm:items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-700 gap-2">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-indigo-600 shrink-0" />
        <span className="font-semibold text-indigo-600 leading-tight text-sm sm:text-base">
          Villa Elisa Funeral Home
        </span>
      </div>
      <div className="relative shrink-0 grip grid-row-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 cursor-pointer font-bold"
        >
          Role: <span>{role}</span>
        </button>
        <button
          onClick={() => setClickLogOut(true)}
          className="relative flex items-center gap-1 text-xs font-bold sm:text-sm text-gray-500 hover:cursor-pointer hover:text-indigo-600 transition-colors duration-500 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-px after:w-full after:bg-indigo-600 after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-500 after:ease-in-out"
        >
          Log Out
        </button>
      </div>
      {clickLogOut && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 bg-opacity-50 min-h-screen w-full z-50">
          <div className="bg-white p-10 rounded-lg shadow-md text-center border-black shadow-black">
            <h2 className="text-4xl text-[#00236F] font-bold mb-4">
              Attention
            </h2>
            <p className="text-lg text-gray-700">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setClickLogOut(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-500 hover:cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  authClient.signOut();
                  setClickLogOut(false);
                  router.push('/');
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-500 hover:cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
