import { fieldClass, labelClass } from './fieldStyles';
import type { ValidationErrors, UpdateField } from './types';
import InlineError from '@/components/inlineError';
import PasswordInput from '@/components/passwordInput';

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
  errors: ValidationErrors;
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Credentials
      </h3>

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
        <PasswordInput
          autoComplete="off"
          value={password}
          onChange={(e) => onChange('password', e.target.value)}
        />
        <InlineError error={errors.password} />
      </div>
    </section>
  );
}
