import { fieldClass, labelClass } from './fieldStyles';
import type { AdminValidationErrors, UpdateField } from '../types';
import InlineError from '../../../../../../components/inlineError';

export default function ContactFields({
  contactNumber,
  onChange,
  errors,
}: {
  contactNumber: string;
  onChange: UpdateField;
  errors: AdminValidationErrors;
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <div>
        <label className={labelClass}>Contact number</label>
        <input
          type="tel"
          value={contactNumber}
          onChange={(e) => onChange('contactNumber', e.target.value)}
          className={fieldClass}
        />
        <InlineError error={errors.contactNumber} />
      </div>
    </div>
  );
}
