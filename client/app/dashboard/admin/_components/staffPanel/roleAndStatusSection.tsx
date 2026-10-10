import { fieldClass, labelClass } from '@/components/formStyles';
import type { ValidationErrors, UpdateField, PanelMode } from './types';
import InlineError from '@/components/inlineError';
import type { StaffRole } from 'shared';
import CompanySection from './companySection';

export default function RoleAndStatusSection({
  mode,
  jobRole,
  role,
  isActive,
  companyid,
  onChange,
  errors,
}: {
  mode: PanelMode;
  jobRole: string;
  role: StaffRole;
  isActive: boolean;
  companyid: number | null;
  onChange: UpdateField;
  errors: ValidationErrors;
}) {
  const isSuper = role === 'superadmin';
  const isAgent = role === 'lifeplan_agent';
  const selectableRoles: StaffRole[] =
    mode === 'create'
      ? ['user', 'admin', 'lifeplan_agent']
      : isSuper
        ? ['superadmin']
        : isAgent
          ? ['lifeplan_agent']
          : ['user', 'admin'];

  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Role & Status
      </h3>

      {!isAgent && (
        <div>
          <label className={labelClass}>Job role</label>
          <input
            value={jobRole}
            onChange={(e) => onChange('jobRole', e.target.value)}
            placeholder="e.g., Administrator"
            className={fieldClass}
          />
          <InlineError error={errors.jobRole} />
        </div>
      )}

      <div>
        <label className={labelClass}>System role</label>

        <div
          className={`grid gap-2 ${
            selectableRoles.length === 3
              ? 'grid-cols-3'
              : selectableRoles.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-1'
          }`}
        >
          {selectableRoles.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => onChange('role', r)}
              className={`py-2 px-1 text-sm font-medium rounded-lg border transition cursor-pointer ${
                role === r
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {r === 'lifeplan_agent' ? 'life plan agent' : r}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onChange('isActive', e.target.checked)}
        />
        Active
      </label>

      {isAgent && (
        <CompanySection
          companyid={companyid}
          onChange={(id) => onChange('companyid', id)}
          error={errors.companyid}
        />
      )}
    </section>
  );
}
