    "use client";

    import Header from "../components/header/header";
    import Footer from "../components/footer/footer";
    import { useState } from "react";
    import {
      // ChevronDown,
      // Building2,
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

    export default function DashboardPage() {
      return (
        <div className="min-h-screen bg-white flex flex-col">

            {/* Header */}
            <Header />
            
            {/* Title */}
            <main className="flex-1 w-full max-w-5xl mx-auto overflow-hidden">
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
          </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}