import { AlertCircle } from 'lucide-react';
import type { LifeplanCompanyAggregate } from 'shared';
import DataTable from '@/components/dataTable';
import type { DataTableColumn } from '@/components/dataTable/types';
import { getLifeplanCompanies } from '@/services/lifeplansService';

interface ServiceArrangementProps {
  data: Record<string, string | undefined>;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

type CompanyColumnKey = keyof LifeplanCompanyAggregate;

const COMPANY_COLUMNS: DataTableColumn<
  LifeplanCompanyAggregate,
  CompanyColumnKey
>[] = [
  {
    key: 'companyname',
    label: 'Lifeplan',
    render: (company) => company.companyname,
  },
  {
    key: 'contactinfo',
    label: 'Contact info',
    render: (company) => company.contactinfo ?? 'No contacts provided',
  },
  {
    key: 'minimumthreshold',
    label: 'Minimum threshold',
    render: (company) => company.minimumthreshold.toLocaleString(),
  },
];

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
          <option value="Direct">Direct</option>
          <option value="LGU">LGU</option>
        </select>
        {errors.plantype && (
          <p className="text-red-700 text-xs font-bold mt-1">
            {errors.plantype}
          </p>
        )}
      </div>

      {data.plantype === 'Life' && (
        <div className="animate-fade-in-down space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              LIFE PLAN COMPANY
            </label>
            <DataTable<LifeplanCompanyAggregate, CompanyColumnKey>
              title="Available lifeplan companies"
              countLabel={(total) => `${total} companies`}
              searchPlaceholder="Search companies..."
              columns={COMPANY_COLUMNS}
              rowKey={(company) => company.companyid}
              defaultSortBy="companyname"
              defaultSortOrder="asc"
              fetchData={({ filters: _filters, ...params }) =>
                getLifeplanCompanies(params)
              }
              onRowClick={(company) =>
                onChange('lifeplancompanyid', String(company.companyid))
              }
              isRowSelected={(company) =>
                data.lifeplancompanyid === String(company.companyid)
              }
              emptyMessage="No lifeplan companies found."
              loadErrorMessage="Could not load lifeplan companies. Try again."
              bodyOffsetClassName="top-12"
            />
            {errors.lifeplancompanyid && (
              <p className="text-red-700 text-xs font-bold mt-1">
                {errors.lifeplancompanyid}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              PLAN NUMBER
            </label>
            <input
              id="lifeplan_plannumber"
              type="text"
              value={data.lifeplan_plannumber || ''}
              onChange={(e) => onChange('lifeplan_plannumber', e.target.value)}
              className="w-full bg-orange-50 text-gray-900 border \
              border-orange-200 rounded-lg p-2.5 text-sm \
              focus:ring-orange-500 focus:border-orange-500 in-disabled:cursor-not-allowed"
              placeholder="e.g., PL-6768420"
            />
            {errors.lifeplan_plannumber && (
              <p className="text-red-700 text-xs font-bold mt-1">
                {errors.lifeplan_plannumber}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              PLAN HOLDER NAME
            </label>
            <input
              id="lifeplan_planholdername"
              type="text"
              value={
                data.lifeplan_planholdername ||
                [data.firstname, data.middlename, data.lastname]
                  .filter(Boolean)
                  .join(' ')
              }
              onChange={(e) =>
                onChange('lifeplan_planholdername', e.target.value)
              }
              className="w-full bg-orange-50 text-gray-900 border \
              border-orange-200 rounded-lg p-2.5 text-sm \
              focus:ring-orange-500 focus:border-orange-500 in-disabled:cursor-not-allowed"
              placeholder="Plan holder name"
            />
            {errors.lifeplan_planholdername && (
              <p className="text-red-700 text-xs font-bold mt-1">
                {errors.lifeplan_planholdername}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              TOTAL AMOUNT (PHP)
            </label>
            <input
              id="lifeplan_totalamount"
              type="number"
              min="0"
              step="0.01"
              value={data.lifeplan_totalamount || ''}
              onChange={(e) => onChange('lifeplan_totalamount', e.target.value)}
              className="w-full bg-orange-50 text-gray-900 border \
              border-orange-200 rounded-lg p-2.5 text-sm \
              focus:ring-orange-500 focus:border-orange-500 in-disabled:cursor-not-allowed"
              placeholder="e.g., 18000"
            />
            {errors.lifeplan_totalamount && (
              <p className="text-red-700 text-xs font-bold mt-1">
                {errors.lifeplan_totalamount}
              </p>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-gray-800">
            <input
              id="lifeplan_use_benefits"
              type="checkbox"
              checked={data.lifeplan_use_benefits !== 'false'}
              onChange={(e) =>
                onChange(
                  'lifeplan_use_benefits',
                  e.target.checked ? 'true' : 'false',
                )
              }
              className="mt-0.5 h-4 w-4 accent-orange-600"
            />
            <span>
              <span className="block font-semibold">
                Use life plan casket/benefits
              </span>
              <span className="block text-xs text-gray-600">
                Clear this if the representative will upgrade to a package
                above the plan&apos;s covered amount.
              </span>
            </span>
          </label>

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
