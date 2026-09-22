import { fieldClass, labelClass } from './constants';
import type { ValidationErrors, UpdateField } from '../types';
import InlineError from '@/components/inlineError';

export default function RoleFields({
  jobRole,
  role,
  isActive,
  onChange,
  errors,
}: {
  jobRole: string;
  role: 'admin' | 'user';
  isActive: boolean;
  onChange: UpdateField;
  errors: ValidationErrors;
}) {
  return (
    <>
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

      <div>
        <label className={labelClass}>System role</label>
        <div className="grid grid-cols-2 gap-2">
          {(['user', 'admin'] as const).map((r) => (
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
              {r}
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
    </>
  );
}
