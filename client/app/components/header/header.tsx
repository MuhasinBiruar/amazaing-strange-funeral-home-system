'use client';

import { useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';

const roles = ['Role A', 'Role B', 'Role C', 'Role D'];

export default function Header() {
  const [role, setRole] = useState(roles[0]);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-start sm:items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-700 gap-2">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-indigo-600 shrink-0" />
        <span className="font-semibold text-indigo-600 leading-tight text-sm sm:text-base">
          Villa Elisa Funeral Home
        </span>
      </div>
      <div className="relative shrink-0">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 cursor-pointer"
        >
          Role: {role}
          <ChevronDown
            size={14}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-32 rounded-md border border-gray-200 bg-white shadow-lg z-10">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-600 hover:bg-indigo-50 cursor-pointer"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
