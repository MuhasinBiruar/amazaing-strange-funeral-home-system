"use client";

import Header from "../components/header/header";
import Footer from "../components/footer/footer";
import PageGuard from "../components/pageguard/page";
import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  Save,
  X,
  Trash2,
  CheckCircle2,
  User,
  Calendar,
} from "lucide-react";

/**
 * Intake page for creating a new deceased profile and managing associated documents.
 *
 * @todo Implement form submission logic, validation, and backend integration for saving the deceased profile and documents.
 * 
 * @remarks
 * The page includes sections for vital statistics, physical description, service arrangement, and a document checklist. It also features a sticky action bar for saving 
 * or discarding the record, and a modal for confirming file deletions.
 */
export default function IntakePage() {
  const [planType, setPlanType] = useState("");
  const [locationOfDeath, setLocationOfDeath] = useState("Hospital");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState(["Release Paper.pdf"]);

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Mock progress for the progress bar
  const documentProgress = 25;

  return (
    <PageGuard>
      <div className="min-h-screen bg-gray-50 flex lg:flex-col flex-wrap pb-24 relative">
        <Header />

        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Header Section */}
          <div>
            <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
              NEW CASE ENTRY
            </span>
            <h1 className="text-3xl font-serif font-bold text-gray-900">
              Deceased Profile
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Create a record for the deceased. Ensure all identifiers
              and legal requirements are complete.
            </p>
          </div>

          {/* Vital Statistics */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-4 text-gray-900">
              <User size={20} />
              <h2 className="text-lg font-bold">Vital Statistics</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  FIRST NAME
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  MIDDLE NAME
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Middle Name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  LAST NAME
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Last Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  DATE OF DEATH
                </label>
                <div
                  className="relative cursor-pointer"
                  onClick={() => dateInputRef.current?.showPicker()}
                >
                  <Calendar
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                  <input
                    ref={dateInputRef}
                    type="date"
                    max="2099-12-31"
                    onKeyDown={(e) => e.preventDefault()}
                    className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 pl-10 text-sm focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  LOCATION OF DEATH
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["House", "Hospital", "Police Case"].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setLocationOfDeath(loc)}
                      className={`py-2 px-1 text-xs sm:text-sm font-medium rounded-lg border transition ${locationOfDeath === loc
                        ? "bg-indigo-900 text-white border-indigo-900"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  IMMEDIATE CAUSE OF DEATH
                </label>
                <textarea
                  className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm min-h-[80px]"
                  placeholder="As stated in the medical certificate or preliminary report..."
                />
              </div>
            </div>
          </section>

          {/* Physical Description */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-4 text-gray-900">
              <FileText size={20} />
              <h2 className="text-lg font-bold">Physical Description</h2>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                DETAILED DESCRIPTION
              </label>
              <textarea
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm min-h-[120px]"
                placeholder="Include estimated height/weight, identifying marks (tattoos, scars), and clothing worn at intake..."
              />
            </div>
          </section>

          {/* Service Arrangement */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Service Arrangement
            </h2>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                PLAN TYPE
              </label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Plan Type...</option>
                <option value="Life Plan">Life Plan</option>
                <option value="At-Need">At-Need (Walk-in)</option>
              </select>
            </div>

            {planType === "Life Plan" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  LIFE PLAN COMPANY
                </label>
                <input
                  type="text"
                  className="w-full bg-orange-50 text-gray-900 border border-orange-200 rounded-lg p-2.5 text-sm focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., St. Peter Life Plan"
                />
                <div className="flex items-start gap-2 mt-2 p-3 bg-orange-50 border border-orange-100 rounded-lg text-orange-800 text-xs">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <p>
                    Life Plan detected. Verification with the provider will be
                    required after submission.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Document Checklist */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Document Checklist
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                4 REQUIRED
              </span>
            </div>

            <div className="space-y-3">
              {/* Completed Document */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-indigo-900" size={20} />
                  <span className="text-sm font-medium text-gray-900">
                    Death Certificate
                  </span>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Pending Upload Document */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Release Paper
                  </span>
                </div>
                <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-indigo-600">
                  <Upload size={14} />
                  UPLOAD
                </button>
              </div>

              <p className="text-[10px] text-gray-400 text-right">Max file size: 2MB per document</p>
            </div>

            {/* Progress Bar */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>PROGRESS</span>
                <span>{documentProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-indigo-900 h-1.5 rounded-full"
                  style={{ width: `${documentProgress}%` }}
                ></div>
              </div>
            </div>
          </section>

          {/* Representative Information (Static/Read-Only Layout) */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 opacity-70 pointer-events-none">
            <div className="flex items-center gap-2 mb-4 text-gray-900">
              <User size={20} />
              <h2 className="text-lg font-bold">Representative Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  PRIMARY CONTACT NAME
                </label>
                <div className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-500">
                  Pending Intake Assignment...
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    RELATIONSHIP
                  </label>
                  <div className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-500">
                    --
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    CONTACT NUMBER
                  </label>
                  <div className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-500">
                    --
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <span className="text-sm font-bold text-indigo-900 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Draft
              </span>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Discard
              </button>
              <button className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-950 rounded-lg hover:bg-indigo-900 transition shadow-sm">
                <Save size={16} />
                Save Record
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle size={24} />
                  <h3 className="text-lg font-bold text-gray-900">Are you sure?</h3>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-600">
                The following files will be moved to the trash. They will be permanently deleted after 30 days.
              </p>

              <ul className="bg-red-50 text-red-800 text-sm p-3 rounded-lg border border-red-100">
                {filesToDelete.map((file, i) => (
                  <li key={i} className="flex items-center gap-2 font-medium">
                    <FileText size={14} /> {file}
                  </li>
                ))}
              </ul>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                >
                  Delete File
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </PageGuard>
  );
}