import { User } from "lucide-react";

export default function RepresentativeInfo() {
  return (
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
  );
}
