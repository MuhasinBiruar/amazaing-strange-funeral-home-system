"use client";

import Header from "../components/header/header";
import Footer from "../components/footer/footer";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { authClient } from "../lib/auth-client";
import PageGuard from "../components/pageguard/page";
import {
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

/**
 * Login page for staff/admin sign-in via username and password.
 *
 * Renders a login form, then on successful authentication shows a
 * welcome modal (name + job role) before the user proceeds to the
 * dashboard. Canceling the modal signs the user back out rather than
 * just dismissing it.
 *
 * @remarks
 * the login form itself performs no client-side redirect until 
 * the user clicks "Proceed" on the welcome modal.
 */
export default function DashboardPage() {

  return (
    // <PageGuard>
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto overflow-hidden">
        <div className="text-left sm:text-center pt-5 sm:pt-8 pb-4 px-4 sm:px-6">
          <h1 className="text-xl sm:text-2xl font-bold text-indigo-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Choose a service to get started.</p>
        </div>
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
      <Footer />
    </div>
    // </PageGuard>
  );
}