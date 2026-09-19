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
          id="plantype"
          value={data.plantype || ''}
          onChange={(e) => onChange('plantype', e.target.value)}
          className="w-full bg-gray-50 text-gray-900 border border-gray-200 \
          rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 in-disabled:cursor-not-allowed"
        >
          <option value="">Select Plan Type...</option>
          <option value="Life">Life Plan</option>
          <option value="Direct">At-Need (Walk-in)</option>
          <option value="LGU">LGU</option>
        </select>
        {errors.plantype && (
          <p className="text-red-700 text-xs font-bold mt-1">
            {errors.plantype}
          </p>
        )}
      </div>

      {data.plantype === 'Life' && (
        <div className="animate-fade-in-down">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            LIFE PLAN COMPANY
          </label>
          <input
            id="lifeplancompany"
            type="text"
            value={data.lifeplancompany || ''}
            onChange={(e) => onChange('lifeplancompany', e.target.value)}
            className="w-full bg-orange-50 text-gray-900 border \
            border-orange-200 rounded-lg p-2.5 text-sm \
            focus:ring-orange-500 focus:border-orange-500 in-disabled:cursor-not-allowed"
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

      {data.plantype === 'LGU' && (
        <div className="animate-fade-in-down space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              REIMBURSEMENT STATUS
            </label>
            <select
              id="lgu_reimbursementstatus"
              value={data.lgu_reimbursementstatus || ''}
              onChange={(e) =>
                onChange('lgu_reimbursementstatus', e.target.value)
              }
              className="w-full bg-gray-50 text-gray-900 border \
              border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 \
              focus:border-indigo-500 in-disabled:cursor-not-allowed"
            >
              <option value="">Select Status...</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="released">Released</option>
              <option value="rejected">Rejected</option>
            </select>
            {errors.lgu_reimbursementstatus && (
              <p className="text-red-700 text-xs font-bold mt-1">
                {errors.lgu_reimbursementstatus}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              REIMBURSEMENT AMOUNT (PHP)
            </label>
            <input
              id="lgu_reimbursementamount"
              type="number"
              min="0"
              step="0.01"
              value={data.lgu_reimbursementamount || ''}
              onChange={(e) =>
                onChange('lgu_reimbursementamount', e.target.value)
              }
              className="w-full bg-gray-50 text-gray-900 border \
              border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 \
              focus:border-indigo-500 in-disabled:cursor-not-allowed"
              placeholder="e.g., 15000"
            />
            {errors.lgu_reimbursementamount && (
              <p className="text-red-700 text-xs font-bold mt-1">
                {errors.lgu_reimbursementamount}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
