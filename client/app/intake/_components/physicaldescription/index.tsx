import { FileText } from "lucide-react";

export default function PhysicalDescription() {
  return (
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
          className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm min-h-30"
          placeholder="Include estimated height/weight, identifying marks (tattoos, scars), and clothing worn at intake..."
        />
      </div>
    </section>
  );
}
