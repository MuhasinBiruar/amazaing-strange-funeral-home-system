    "use client";

    import { useState } from "react";
    import {
      ChevronDown,
      Building2,
      Wallet,
      AlertTriangle,
      FileSignature,
      UserPlus,
      ClipboardCheck,
      RefreshCcw,
      FolderOpen,
      Package,
    } from "lucide-react";

    const modules = [
      { name: "Financial Dashboard", icon: Wallet },
      { name: "Special Cases", icon: AlertTriangle },
      { name: "Contracting", icon: FileSignature },
      { name: "Intake & Profiling", icon: UserPlus },
      { name: "Inventory Audits", icon: ClipboardCheck },
      { name: "Daily Payments", icon: RefreshCcw },
      { name: "Document Hub", icon: FolderOpen },
      { name: "Basic Inventory", icon: Package },
    ];
    // list of roles placeholder it bro
    const roles = ["Role A", "Role B", "Role C", "Role D"];


    export default function DashboardPage() {
          const [role, setRole] = useState(roles[0]);
          const [open, setOpen] = useState(false);
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-2xl rounded-xl border border-indigo-500 bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-start sm:items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 gap-2">
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
                  <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
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

            {/* Title */}
            <div className="text-left sm:text-center pt-5 sm:pt-8 pb-4 px-4 sm:px-6">
              <h1 className="text-xl sm:text-2xl font-bold text-indigo-900">
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Choose a service to get started.
              </p>
            </div>

            {/* Module grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 pb-6 sm:pb-8">
              {modules.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-5 sm:py-6 px-2 hover:border-indigo-400 hover:shadow-md transition cursor-pointer"
                >
                  <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Icon size={18} />
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 text-center leading-tight">
                    {name}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-5 py-3 border-t border-gray-200 text-[11px] sm:text-xs text-gray-400 gap-1 sm:gap-0">
              <span>© 2024 Villa Elisa Funeral Home. All rights reserved.</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span>System Status: Operational</span>
                <span>Privacy Policy</span>
                <span>Support</span>
              </div>
            </div>
          </div>
        </div>
      );
    }