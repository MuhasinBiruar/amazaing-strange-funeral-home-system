import { fieldClass, labelClass } from './fieldStyles';
import type { ValidationErrors, UpdateField } from './types';
import InlineError from '@/components/inlineError';

export default function NameFields({
  form,
  onChange,
  errors,
}: {
  form: {
    firstName: string;
    middleName: string;
    lastName: string;
    contactNumber: string;
  };
  onChange: UpdateField;
  errors: ValidationErrors;
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Personal information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>First name</label>
          <input
            value={form.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            className={fieldClass}
          />
          <InlineError error={errors.firstName} />
        </div>
        <div>
          <label className={labelClass}>Middle name</label>
          <input
            value={form.middleName}
            onChange={(e) => onChange('middleName', e.target.value)}
            className={fieldClass}
          />
          <InlineError error={errors.middleName} />
        </div>
        <div>
          <label className={labelClass}>Last name</label>
          <input
            value={form.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            className={fieldClass}
          />
          <InlineError error={errors.lastName} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className={labelClass}>Contact number</label>
          <input
            type="tel"
            value={form.contactNumber}
            onChange={(e) => onChange('contactNumber', e.target.value)}
            className={fieldClass}
          />
          <InlineError error={errors.contactNumber} />
        </div>
      </div>
    </section>
  );
}
