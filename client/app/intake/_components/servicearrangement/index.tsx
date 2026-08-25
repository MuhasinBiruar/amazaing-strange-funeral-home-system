import { AlertCircle } from "lucide-react";

interface ServiceArrangementProps {
  planType: string;
  setPlanType: (plan: string) => void;
}

export default function ServiceArrangement({
  planType,
  setPlanType,
}: ServiceArrangementProps) {
  return (
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
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <p>
              Life Plan detected. Verification with the provider will be
              required after submission.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
