'use client';

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { authClient } from "@/app/lib/auth-client";


export default function Header() {
  const [role, setRole] = useState("");
  const [open, setOpen] = useState(false);


  useEffect(() => {

    authClient.getSession().then(({ data, error }) => {
      console.log("Session data:", data); //remove later
      const user = data?.user as unknown as { jobRole?: string } | undefined;
      setRole(user?.jobRole ?? "Unknown Role");
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
      <div className="relative shrink-0">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 cursor-pointer"
        >
          Role: <span>{role}</span>
        </button>


      </div>
    </div>
  );
}
