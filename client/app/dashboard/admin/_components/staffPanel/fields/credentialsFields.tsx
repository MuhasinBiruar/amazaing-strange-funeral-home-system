import { fieldClass, labelClass } from './fieldStyles';
import type { AdminValidationErrors, UpdateField } from '../types';
import InlineError from '../../../../../../components/inlineError';

export default function CredentialsFields({
  mode,
  username,
  password,
  onChange,
  errors,
}: {
  mode: 'create' | 'edit';
  username: string;
  password: string;
  onChange: UpdateField;
  errors: AdminValidationErrors;
}) {
  return (
    <>
      {mode === 'edit' && (
        <div>
          <label className={labelClass}>Username</label>
          <input
            value={username}
            onChange={(e) => onChange('username', e.target.value)}
            className={fieldClass}
          />
          <InlineError error={errors.username} />
        </div>
      )}

      <div>
        <label className={labelClass}>
          {mode === 'create' ? 'Password' : 'New password'}
        </label>
        {mode === 'edit' && (
          <span className="text-gray-400 text-xs block mb-1">
            Leave blank to keep the current password.
          </span>
        )}
        <input
          type="password"
          autoComplete="off"
          value={password}
          onChange={(e) => onChange('password', e.target.value)}
          className={fieldClass}
        />
        <InlineError error={errors.password} />
      </div>
    </>
  );
}
