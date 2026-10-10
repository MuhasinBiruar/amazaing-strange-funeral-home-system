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
  const isAgent = role === 'lifeplan_agent';
  const selectableRoles: StaffRole[] =
    mode === 'create' ? ['user', 'admin', 'lifeplan_agent'] : ['user', 'admin'];

  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Role & Status
      </h3>

      {role === 'superadmin' ? (
        <p className="text-sm font-medium text-indigo-700">
          Superadmin (role and status cannot be changed)
        </p>
      ) : isAgent && mode === 'edit' ? (
        <p className="text-sm font-medium text-amber-700">
          Life plan agent (role cannot be changed)
        </p>
      ) : (
        <>
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
              className={`grid gap-2 ${selectableRoles.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
            >
              {selectableRoles.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => onChange('role', r)}
                  className={`py-2 px-1 text-sm font-medium rounded-lg border transition cursor-pointer ${
                    role === r
                      ? 'bg-indigo-900 text-white border-indigo-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {r === 'lifeplan_agent' ? 'life plan agent' : r}
                </button>
              ))}
            </div>
          </div>

          {isAgent && mode === 'create' && (
            <CompanySection
              companyid={companyid}
              onChange={(id) => onChange('companyid', id)}
              error={errors.companyid}
            />
          )}
        </>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onChange('isActive', e.target.checked)}
          disabled={role === 'superadmin'}
        />
        Active
      </label>
    </section>
  );
}
