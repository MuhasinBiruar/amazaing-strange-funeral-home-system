import { AlertCircle } from 'lucide-react';

interface ServiceArrangementProps {
  data: Record<string, string | undefined>;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export default function ServiceArrangement({
  data,
  onChange,
  errors = {},
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
          id="planType"
          value={data.someField || ''}
          onChange={(e) => onChange('planType', e.target.value)}
          className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select Plan Type...</option>
          <option value="Life Plan">Life Plan</option>
          <option value="At-Need">At-Need (Walk-in)</option>
        </select>
        {errors.planType && (
          <p className="text-red-700 text-xs font-bold mt-1">
            {errors.planType}
          </p>
        )}
      </div>

      {data.planType === 'Life Plan' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            LIFE PLAN COMPANY
          </label>
          <input
            id="lifeplancompany"
            type="text"
            value={data.lifeplancompany || ''}
            onChange={(e) => onChange('lifeplancompany', e.target.value)}
            className="w-full bg-orange-50 text-gray-900 border border-orange-200 rounded-lg p-2.5 text-sm focus:ring-orange-500 focus:border-orange-500"
            placeholder="e.g., St. Peter Life Plan"
          />
          {errors.lifeplancompany && (
            <p className="text-red-700 text-xs font-bold mt-1">
              {errors.lifeplancompany}
            </p>
          )}
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
